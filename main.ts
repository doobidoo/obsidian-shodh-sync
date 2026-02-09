import { App, Plugin, PluginSettingTab, Setting, Notice } from 'obsidian';
import { requestUrl } from 'obsidian';

interface ShodhSyncSettings {
  shodhUrl: string;
  apiKey: string;
  userId: string;
  syncFolder: string;
}

const DEFAULT_SETTINGS: ShodhSyncSettings = {
  shodhUrl: 'http://localhost:3030',
  apiKey: '',
  userId: 'henry',
  syncFolder: 'Memories'
};

export default class ShodhSync extends Plugin {
  settings: ShodhSyncSettings;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: 'sync-shodh',
      name: 'Sync Shodh Memories',
      callback: () => this.syncMemories(),
    });

    this.addSettingTab(new ShodhSettingTab(this.app, this));
  }

  async syncMemories() {
    try {
      const requestBody: any = {
        query: '*',
        limit: 1000,
      };

      // Only include user_id if it's set
      if (this.settings.userId) {
        requestBody.user_id = this.settings.userId;
      }

      const response = await requestUrl({
        url: `${this.settings.shodhUrl}/api/recall`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.settings.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      const data = response.json;
      await this.processMemories(data.memories || []);
      new Notice(`Synced ${data.memories?.length || 0} memories!`);
    } catch (error) {
      new Notice(`Sync failed: ${error.message}`);
    }
  }

  async processMemories(memories: any[]) {
    const folder = this.settings.syncFolder;
    for (const mem of memories) {
      const date = (mem.created_at || mem.timestamp || new Date().toISOString()).split('T')[0];
      const tags = mem.tags || [];
      const year = date.split('-')[0];
      const month = date.split('-')[1];
      const folderPath = `${folder}/${year}/${month}`;
      const path = `${folderPath}/${mem.id || 'untitled'}.md`;

      const content = `---
date: ${date}
tags: [${tags.join(', ')}]
type: ${mem.memory_type || 'unknown'}
---

${mem.content}
`;

      // Ensure folder exists
      if (!(await this.app.vault.adapter.exists(folderPath))) {
        await this.app.vault.createFolder(folderPath);
      }

      // Check if file exists and update or create
      if (await this.app.vault.adapter.exists(path)) {
        await this.app.vault.adapter.write(path, content);
      } else {
        await this.app.vault.create(path, content);
      }
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class ShodhSettingTab extends PluginSettingTab {
  plugin: ShodhSync;

  constructor(app: App, plugin: ShodhSync) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const {containerEl} = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName('Shodh URL')
      .setDesc('Base URL of Shodh server (local or Cloudflare)')
      .addText(text => text
        .setPlaceholder('http://localhost:3030')
        .setValue(this.plugin.settings.shodhUrl)
        .onChange(async (value) => {
          this.plugin.settings.shodhUrl = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('API Key')
      .addText(text => text
        .setPlaceholder('df2db195...')
        .setValue(this.plugin.settings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.apiKey = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('User ID')
      .setDesc('Shodh user_id')
      .addText(text => text
        .setValue(this.plugin.settings.userId)
        .onChange(async (value) => {
          this.plugin.settings.userId = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Sync Folder')
      .setDesc('Vault folder for memories (creates subfolders Year/Month)')
      .addText(text => text
        .setValue(this.plugin.settings.syncFolder)
        .onChange(async (value) => {
          this.plugin.settings.syncFolder = value;
          await this.plugin.saveSettings();
        }));
  }
}
