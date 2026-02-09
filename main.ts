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
      new Notice('Starting sync...');
      let allMemories: any[] = [];
      let offset = 0;
      const batchSize = 100;
      let total = 0;

      // Fetch all memories with pagination using /api/memories endpoint
      while (true) {
        const url = `${this.settings.shodhUrl}/api/memories?limit=${batchSize}&offset=${offset}`;

        const response = await requestUrl({
          url: url,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.settings.apiKey}`,
          },
        });

        const data = response.json;
        const memories = data.memories || [];
        total = data.total || 0;

        if (memories.length === 0) {
          break;
        }

        allMemories.push(...memories);
        offset += memories.length;

        new Notice(`Fetched ${allMemories.length}/${total} memories...`);

        // If we got fewer than batchSize, we've reached the end
        if (memories.length < batchSize) {
          break;
        }
      }

      await this.processMemories(allMemories);
      new Notice(`✓ Synced ${allMemories.length} memories!`);
    } catch (error) {
      new Notice(`Sync failed: ${error.message}`);
    }
  }

  generateFileName(mem: any, date: string): string {
    // Extract first line or first 50 chars of content as title
    let title = mem.content.split('\n')[0].trim();
    if (title.length > 50) {
      title = title.substring(0, 50);
    }

    // Remove special characters and replace spaces with hyphens
    title = title
      .replace(/[^\w\s\-äöüÄÖÜß]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();

    // If title is empty or too short, use memory type
    if (title.length < 3) {
      title = mem.memory_type?.toLowerCase() || 'memory';
    }

    // Add date prefix and first 8 chars of ID to ensure uniqueness
    const shortId = mem.id.substring(0, 8);
    return `${date}_${title}_${shortId}`;
  }

  async processMemories(memories: any[]) {
    const folder = this.settings.syncFolder;
    for (const mem of memories) {
      const date = (mem.created_at || mem.timestamp || new Date().toISOString()).split('T')[0];
      const tags = mem.tags || [];
      const year = date.split('-')[0];
      const month = date.split('-')[1];
      const folderPath = `${folder}/${year}/${month}`;

      const fileName = this.generateFileName(mem, date);
      const path = `${folderPath}/${fileName}.md`;

      const content = `---
date: ${date}
tags: [${tags.join(', ')}]
type: ${mem.memory_type || 'unknown'}
id: ${mem.id}
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
