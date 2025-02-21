const MAIL_TM_API = "https://api.mail.tm";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or anon key in environment variables.');
}
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export interface Domain {
  id: string;
  domain: string;
  isActive: boolean;
  isPrivate: boolean;
}

export interface MailTmAccount {
  id: string;
  address: string;
  quota: number;
  used: number;
  isDisabled: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  accountId: string;
  msgid: string;
  from: { address: string; name?: string };
  to: Array<{ address: string; name?: string }>;
  subject: string;
  intro: string;
  seen: boolean;
  isDeleted: boolean;
  hasAttachments: boolean;
  size: number;
  downloadUrl: string;
  createdAt: string;
  updatedAt: string;
  text?: string;
  html?: string;
}

export interface MailTmError {
  type: string;
  title: string;
  detail: string;
  "hydra:description"?: string;
  status?: number;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (i < retries - 1) {
        await delay(RETRY_DELAY * Math.pow(2, i)); // Exponential backoff
      }
    }
  }

  throw lastError;
}

async function storeEmailInSupabase(email: Message, accountEmail: string) {
  try {
    const { data: existingEmail } = await supabase
      .from('emails')
      .select()
      .eq('message_id', email.id)
      .single();

    if (!existingEmail) {
      const { error } = await supabase.from('emails').insert({
        message_id: email.id,
        account_email: accountEmail,
        from_address: email.from.address,
        from_name: email.from.name,
        to_addresses: email.to.map(to => ({ address: to.address, name: to.name })),
        subject: email.subject,
        intro: email.intro,
        text_content: email.text,
        html_content: email.html,
        seen: email.seen,
        is_deleted: email.isDeleted,
        has_attachments: email.hasAttachments,
        size: email.size,
        created_at: email.createdAt,
        updated_at: email.updatedAt,
      });

      if (error) {
        console.error('Error storing email in Supabase:', error);
      }
    }
  } catch (error) {
    console.error('Error checking/storing email in Supabase:', error);
  }
}

function getAuthHeaders() {
  const token =
    typeof window !== "undefined"
      ? document.cookie
          .split("; ")
          .find((row) => row.startsWith("mail_tm_token="))
          ?.split("=")[1]
      : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function checkAuth(): Promise<boolean> {
  const token =
    typeof window !== "undefined"
      ? document.cookie
          .split("; ")
          .find((row) => row.startsWith("mail_tm_token="))
          ?.split("=")[1]
      : null;

  if (!token) {
    return false;
  }

  try {
    const response = await retryOperation(() =>
      fetch(`${MAIL_TM_API}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
    );
    return response.ok;
  } catch (error) {
    console.error("Auth check failed:", error);
    return false;
  }
}

export async function getAvailableDomains(): Promise<Domain[]> {
  try {
    const response = await retryOperation(() =>
      fetch(`${MAIL_TM_API}/domains`, {
        headers: getAuthHeaders(),
      })
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error["hydra:description"] || "Failed to fetch available domains"
      );
    }

    const data = await response.json();
    return data["hydra:member"];
  } catch (error) {
    console.error("Error fetching domains:", error);
    throw error;
  }
}

export async function createMailTmAccount(
  username: string,
  password: string,
  domain: string
): Promise<MailTmAccount> {
  try {
    const response = await retryOperation(() =>
      fetch(`${MAIL_TM_API}/accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: `${username}@${domain}`,
          password: password,
        }),
      })
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data["hydra:description"] || data.message || "Failed to create account"
      );
    }
    return data;
  } catch (error) {
    console.error("Error creating Mail.tm account:", error);
    throw error;
  }
}

export async function loginMailTm(address: string, password: string) {
  try {
    const response = await retryOperation(() =>
      fetch(`${MAIL_TM_API}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          password,
        }),
      })
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data["hydra:description"] || data.message || "Failed to login"
      );
    }

    // Get account details after successful login
    const accountResponse = await retryOperation(() =>
      fetch(`${MAIL_TM_API}/me`, {
        headers: {
          Authorization: `Bearer ${data.token}`,
          "Content-Type": "application/json",
        },
      })
    );
    const accountData = await accountResponse.json();

    if (typeof window !== "undefined") {
      // Set cookies with proper expiration (24 hours) and security flags
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `mail_tm_token=${data.token}; path=/; expires=${expires}; SameSite=Strict; Secure`;
      document.cookie = `mail_tm_account=${JSON.stringify({
        id: accountData.id,
        email: address,
      })}; path=/; expires=${expires}; SameSite=Strict; Secure`;
    }

    return {
      ...data,
      account: accountData,
    };
  } catch (error) {
    console.error("Error logging in to Mail.tm:", error);
    throw error;
  }
}

export async function logout() {
  if (typeof window !== "undefined") {
    document.cookie =
      "mail_tm_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict; Secure";
    document.cookie =
      "mail_tm_account=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict; Secure";
  }
}

export async function getMessages(
  page = 1,
  itemsPerPage = 20,
  includeStored = true
): Promise<{ messages: Message[]; total: number }> {
  try {
    // Get messages from Mail.tm
    const response = await retryOperation(() =>
      fetch(
        `${MAIL_TM_API}/messages?page=${page}&itemsPerPage=${itemsPerPage}`,
        {
          headers: getAuthHeaders(),
        }
      )
    );

    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }

    const data = await response.json();
    const mailTmMessages = data["hydra:member"];

    if (!includeStored) {
      return {
        messages: mailTmMessages,
        total: data["hydra:totalItems"],
      };
    }

    // Get the current account email
    const accountCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("mail_tm_account="));

    if (!accountCookie) {
      return {
        messages: mailTmMessages,
        total: data["hydra:totalItems"],
      };
    }

    const accountData = JSON.parse(decodeURIComponent(accountCookie.split("=")[1]));
    const accountEmail = accountData.email;

    // Get messages from Supabase
    const { data: storedEmails, error } = await supabase
      .from('emails')
      .select('*')
      .eq('account_email', accountEmail)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching stored emails:', error);
      return {
        messages: mailTmMessages,
        total: data["hydra:totalItems"],
      };
    }

    // Store new messages in Supabase
    for (const email of mailTmMessages) {
      await storeEmailInSupabase(email, accountEmail);
    }

    // Convert stored emails to Message format
    const storedMessages: Message[] = storedEmails.map(email => ({
      id: email.message_id,
      accountId: email.account_email,
      msgid: email.message_id,
      from: {
        address: email.from_address,
        name: email.from_name,
      },
      to: email.to_addresses,
      subject: email.subject,
      intro: email.intro,
      text: email.text_content,
      html: email.html_content,
      seen: email.seen,
      isDeleted: email.is_deleted,
      hasAttachments: email.has_attachments,
      size: email.size,
      downloadUrl: '', // No download URL for stored messages
      createdAt: email.created_at,
      updatedAt: email.updated_at,
    }));

    // Merge and deduplicate messages
    const allMessages = [...mailTmMessages];
    for (const storedMsg of storedMessages) {
      if (!allMessages.some(msg => msg.id === storedMsg.id)) {
        allMessages.push(storedMsg);
      }
    }

    // Sort by date
    allMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      messages: allMessages,
      total: allMessages.length,
    };
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
}

export async function getMessage(id: string): Promise<Message> {
  try {
    // Try Mail.tm first
    try {
      const response = await retryOperation(() =>
        fetch(`${MAIL_TM_API}/messages/${id}`, {
          headers: getAuthHeaders(),
        })
      );

      if (response.ok) {
        const message = await response.json();

        // Store in Supabase for permanence
        const accountCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("mail_tm_account="));

        if (accountCookie) {
          const accountData = JSON.parse(decodeURIComponent(accountCookie.split("=")[1]));
          await storeEmailInSupabase(message, accountData.email);
        }

        return message;
      }
    } catch (error) {
      console.error("Failed to fetch from Mail.tm, trying Supabase:", error);
    }

    // If Mail.tm fails or message not found, try Supabase
    const { data: email, error } = await supabase
      .from('emails')
      .select('*')
      .eq('message_id', id)
      .single();

    if (error) throw error;
    if (!email) throw new Error("Message not found");

    return {
      id: email.message_id,
      accountId: email.account_email,
      msgid: email.message_id,
      from: {
        address: email.from_address,
        name: email.from_name,
      },
      to: email.to_addresses,
      subject: email.subject,
      intro: email.intro,
      text: email.text_content,
      html: email.html_content,
      seen: email.seen,
      isDeleted: email.is_deleted,
      hasAttachments: email.has_attachments,
      size: email.size,
      downloadUrl: '', // No download URL for stored messages
      createdAt: email.created_at,
      updatedAt: email.updated_at,
    };
  } catch (error) {
    console.error("Error fetching message:", error);
    throw error;
  }
}

export async function markMessageAsRead(id: string): Promise<void> {
  try {
    // Try to mark as read in Mail.tm
    try {
      const response = await retryOperation(() =>
        fetch(`${MAIL_TM_API}/messages/${id}`, {
          method: "PATCH",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/merge-patch+json",
          },
          body: JSON.stringify({ seen: true }),
        })
      );

      if (!response.ok) {
        throw new Error("Failed to mark message as read in Mail.tm");
      }
    } catch (error) {
      console.error("Failed to mark as read in Mail.tm:", error);
    }

    // Also update in Supabase
    const { error } = await supabase
      .from('emails')
      .update({ seen: true })
      .eq('message_id', id);

    if (error) {
      console.error("Failed to mark as read in Supabase:", error);
    }
  } catch (error) {
    console.error("Error marking message as read:", error);
    throw error;
  }
}

export async function deleteMessage(id: string): Promise<void> {
  try {
    // Try to delete from Mail.tm
    try {
      const response = await retryOperation(() =>
        fetch(`${MAIL_TM_API}/messages/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        })
      );

      if (!response.ok) {
        console.error("Failed to delete from Mail.tm");
      }
    } catch (error) {
      console.error("Error deleting from Mail.tm:", error);
    }

    // Mark as deleted in Supabase (we keep the record but mark it as deleted)
    const { error } = await supabase
      .from('emails')
      .update({ is_deleted: true })
      .eq('message_id', id);

    if (error) {
      console.error("Failed to mark as deleted in Supabase:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
}

export async function deleteAccount(): Promise<void> {
  try {
    const account =
      typeof window !== "undefined"
        ? document.cookie
            .split("; ")
            .find((row) => row.startsWith("mail_tm_account="))
            ?.split("=")[1]
        : null;

    if (!account) {
      throw new Error("No account found");
    }

    const { id, email } = JSON.parse(account);

    // Delete from Mail.tm
    try {
      const response = await retryOperation(() =>
        fetch(`${MAIL_TM_API}/accounts/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        })
      );

      if (!response.ok) {
        console.error("Failed to delete account from Mail.tm");
      }
    } catch (error) {
      console.error("Error deleting account from Mail.tm:", error);
    }

    // Mark all emails as deleted in Supabase
    const { error } = await supabase
      .from('emails')
      .update({ is_deleted: true })
      .eq('account_email', email);

    if (error) {
      console.error("Failed to mark emails as deleted in Supabase:", error);
    }

    // Clear cookies after deletion
    logout();
  } catch (error) {
    console.error("Error deleting account:", error);
    throw error;
  }
}
