-- Keymaps (VSCode/Zed muscle memory). Plugin keys live in their plugin file.
-- Press <Space> and wait: which-key lists everything.
local map = vim.keymap.set

-- Tree
map("n", "<C-n>", "<cmd>NvimTreeToggle<cr>", { desc = "Toggle file tree" })
map("n", "<leader>t", "<cmd>NvimTreeToggle<cr>", { desc = "Show/hide file tree" })
map("n", "<leader>e", "<cmd>NvimTreeFocus<cr>", { desc = "Focus file tree" })

-- Saving
map({ "n", "i", "v" }, "<C-s>", "<cmd>w<cr><esc>", { desc = "Save" })

-- Window nav (editor on right, tree on left)
map("n", "<C-h>", "<C-w>h", { desc = "Go left" })
map("n", "<C-l>", "<C-w>l", { desc = "Go right" })

-- Wrapped lines: move by screen line, not file line
map({ "n", "x" }, "j", "v:count == 0 ? 'gj' : 'j'", { expr = true, silent = true })
map({ "n", "x" }, "k", "v:count == 0 ? 'gk' : 'k'", { expr = true, silent = true })

-- Clear search highlight
map("n", "<Esc>", "<cmd>nohlsearch<cr>", { desc = "Clear search highlight" })

-- Markdown
map("n", "<leader>mp", "<cmd>MarkdownPreviewToggle<cr>", { desc = "Browser markdown preview" })
map("n", "<leader>mm", "<cmd>RenderMarkdown toggle<cr>", { desc = "Toggle inline markdown render" })

-- Diagnostics
map("n", "<leader>cd", vim.diagnostic.open_float, { desc = "Show error under cursor" })
