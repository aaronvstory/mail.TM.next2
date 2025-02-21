const MAIL_TM_API = "https://api.mail.tm";

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
}

function getAuthHeaders() {
  const token =
    typeof window !== "undefined"
      ? document.cookie
          .split("; ")
          .find((row) => row.startsWith("mail_tm_token="))
          ?.split("=")[1]
      : null;
  return token
    ? {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    : {
        "Content-Type": "application/json",
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
  return !!token;
}

export async function getAvailableDomains(): Promise<Domain[]> {
  const response = await fetch(`${MAIL_TM_API}/domains`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch domains");
  }

  const data = await response.json();
  return data["hydra:member"];
}

export async function createMailTmAccount(
  username: string,
  password: string,
  domain: string
): Promise<MailTmAccount> {
  const response = await fetch(`${MAIL_TM_API}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address: `${username}@${domain}`,
      password: password,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error["hydra:description"] || "Failed to create account");
  }

  return response.json();
}

export async function loginMailTm(address: string, password: string) {
  const response = await fetch(`${MAIL_TM_API}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password }),
  });

  if (!response.ok) {
    throw new Error("Invalid email or password");
  }

  return response.json();
}

export async function logout() {
  if (typeof window !== "undefined") {
    document.cookie =
      "mail_tm_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "mail_tm_account=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

export async function getMessages(
  page = 1,
  itemsPerPage = 20
): Promise<{ messages: Message[]; total: number }> {
  const response = await fetch(
    `${MAIL_TM_API}/messages?page=${page}&pageSize=${itemsPerPage}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch messages");
  }

  const data = await response.json();
  return {
    messages: data["hydra:member"],
    total: data["hydra:totalItems"],
  };
}

export async function getMessage(id: string): Promise<Message> {
  const response = await fetch(`${MAIL_TM_API}/messages/${id}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch message");
  }

  return response.json();
}
