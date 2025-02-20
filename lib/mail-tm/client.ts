const MAIL_TM_API = "https://api.mail.tm";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

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
  itemsPerPage = 20
): Promise<{ messages: Message[]; total: number }> {
  try {
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
    return {
      messages: data["hydra:member"],
      total: data["hydra:totalItems"],
    };
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
}

export async function getMessage(id: string): Promise<Message> {
  try {
    const response = await retryOperation(() =>
      fetch(`${MAIL_TM_API}/messages/${id}`, {
        headers: getAuthHeaders(),
      })
    );

    if (!response.ok) {
      throw new Error("Failed to fetch message");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching message:", error);
    throw error;
  }
}

export async function markMessageAsRead(id: string): Promise<void> {
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
      throw new Error("Failed to mark message as read");
    }
  } catch (error) {
    console.error("Error marking message as read:", error);
    throw error;
  }
}

export async function deleteMessage(id: string): Promise<void> {
  try {
    const response = await retryOperation(() =>
      fetch(`${MAIL_TM_API}/messages/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
    );

    if (!response.ok) {
      throw new Error("Failed to delete message");
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

    const { id } = JSON.parse(account);
    const response = await retryOperation(() =>
      fetch(`${MAIL_TM_API}/accounts/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
    );

    if (!response.ok) {
      throw new Error("Failed to delete account");
    }

    // Clear cookies after successful deletion
    logout();
  } catch (error) {
    console.error("Error deleting account:", error);
    throw error;
  }
}
