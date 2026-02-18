export class GoogleDriveService {
    private clientId: string;
    private apiKey: string;
    private tokenClient: any;
    private gapiInited: boolean = false;
    private gisInited: boolean = false;

    constructor() {
        this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
        this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
    }

    // Load the GAPI scripts dynamically if not present
    public loadScripts(): Promise<void> {
        return new Promise((resolve, reject) => {
            if ((window as any).gapi && (window as any).google?.accounts) {
                this.gapiInited = true;
                this.gisInited = true;
                resolve();
                return;
            }

            const script1 = document.createElement('script');
            script1.src = 'https://apis.google.com/js/api.js';
            script1.onload = () => this.gapiLoaded().then(() => { if (this.gisInited) resolve(); });
            script1.onerror = reject;
            document.body.appendChild(script1);

            const script2 = document.createElement('script');
            script2.src = 'https://accounts.google.com/gsi/client';
            script2.onload = () => { this.gisLoaded(); if (this.gapiInited) resolve(); };
            script2.onerror = reject;
            document.body.appendChild(script2);
        });
    }

    private async gapiLoaded() {
        return new Promise<void>((resolve) => {
            (window as any).gapi.load('client', async () => {
                await (window as any).gapi.client.init({
                    apiKey: this.apiKey,
                    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                });
                this.gapiInited = true;
                resolve();
            });
        });
    }

    private gisLoaded() {
        this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: this.clientId,
            scope: 'https://www.googleapis.com/auth/drive.file',
            callback: '', // defined at request time
        });
        this.gisInited = true;
    }

    public async connect(): Promise<string> {
        if (!this.clientId) throw new Error("Missing Google Client ID. Please add VITE_GOOGLE_CLIENT_ID to .env");

        return new Promise((resolve, reject) => {
            this.tokenClient.callback = async (resp: any) => {
                if (resp.error) {
                    reject(resp);
                    return;
                }
                resolve(resp.access_token);
            };

            if ((window as any).gapi.client.getToken() === null) {
                // Prompt the user to select a Google Account and ask for consent to share their data
                // when establishing a new session.
                this.tokenClient.requestAccessToken({ prompt: 'consent' });
            } else {
                // Skip display of account chooser and consent dialog for an existing session.
                this.tokenClient.requestAccessToken({ prompt: '' });
            }
        });
    }

    public async createFolder(folderName: string): Promise<string> {
        const response = await (window as any).gapi.client.drive.files.create({
            resource: {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
            },
            fields: 'id',
        });
        return response.result.id;
    }

    public async uploadFile(name: string, content: string, folderId?: string): Promise<void> {
        // This is a simplified text upload. Real usage might need multipart for binary.
        const metadata: any = {
            name,
            mimeType: 'text/plain',
        };
        if (folderId) {
            metadata.parents = [folderId];
        }

        const accessToken = (window as any).gapi.client.getToken().access_token;
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([content], { type: 'text/plain' }));

        await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
            body: form,
        });
    }
}

export const googleDrive = new GoogleDriveService();
