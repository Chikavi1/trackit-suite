// =========================
// TYPES
// =========================
export interface ClientTraits {
  name?: string;
  email?: string;
  phone?: string;
  externalId?: string;
}

interface ClientIdentityOptions {
  businessId: string;
  endpoint?: string;
  storageKey?: string;
}

// =========================
// CLIENT IDENTITY SDK
// =========================
export class ClientIdentity {
  private readonly endpoint: string;
  private readonly businessId: string;
  private readonly storageKey: string;

  constructor(options: ClientIdentityOptions) {
    if (!options.businessId) {
      throw new Error('[PulseTrack] businessId is required');
    }

    this.businessId = options.businessId;
    this.endpoint =
      options.endpoint ?? 'http://localhost:3001/clients';

    this.storageKey = options.storageKey ?? 'pt_client_id';
  }

  // =========================
  // IDENTIFY (login / register)
  // =========================
  async identify(
    externalId: string,
    traits?: ClientTraits
  ): Promise<{ client_id: string }> {
    if (!externalId) {
      throw new Error('[PulseTrack] externalId is required');
    }

    const response = await this.send({
      action: 'identify',
      external_id: externalId,
      traits,
    });

    if (response?.client_id) {
      this.setClientId(response.client_id);
    }

    return response;
  }

  // =========================
  // UPDATE PROFILE
  // =========================
  async update(traits: ClientTraits) {
    const clientId = this.getClientId();

    if (!clientId) {
      throw new Error(
        '[PulseTrack] Cannot update client before identify()'
      );
    }

    return this.send({
      action: 'update',
      client_id: clientId,
      traits,
    });
  }

  // =========================
  // LOGOUT / UNLINK
  // =========================
  clearIdentity(): void {
    this.removeClientId();
  }

  // =========================
  // READ STATE
  // =========================
  getClientId(): string | null {
    return localStorage.getItem(this.storageKey);
  }

  isIdentified(): boolean {
    return !!this.getClientId();
  }

  // =========================
  // STORAGE (internal)
  // =========================
  private setClientId(clientId: string): void {
    localStorage.setItem(this.storageKey, clientId);
  }

  private removeClientId(): void {
    localStorage.removeItem(this.storageKey);
  }

  // =========================
  // REQUEST
  // =========================
  private async send(payload: any): Promise<any> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        business_id: this.businessId,
        ...payload,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(
        `[PulseTrack] Request failed (${res.status}): ${error}`
      );
    }

    return res.json();
  }
}
