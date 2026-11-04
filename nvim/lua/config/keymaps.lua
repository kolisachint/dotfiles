-- Keymaps (VSCode/Zed muscle memory). Plugin keys live in their plugin file.
-- Press ; and wait: which-key lists everything.
local map = vim.keymap.set

-- Tree
map("n", "<C-n>", "<cmd>NvimTreeToggle<cr>", { desc = "Toggle file tree" })
map("n", "<leader>t", "<cmd>NvimTreeToggle<cr>", { desc = "Show/hide file tree" })
map("n", "<leader>e", "<cmd>NvimTreeFocus<cr>", { desc = "Focus file tree" })

-- Saving
map({ "n", "i", "v" }, "<C-s>", "<cmd>w<cr><esc>", { desc = "Save" })

-- Window nav (editor on right, tree on left)
-- Bare Ctrl-h/j/k/l: safe — rex/tmux only act on these AFTER their prefix.
map("n", "<C-h>", "<C-w>h", { desc = "Go left" })
map("n", "<C-j>", "<C-w>j", { desc = "Go down" })
map("n", "<C-k>", "<C-w>k", { desc = "Go up" })
map("n", "<C-l>", "<C-w>l", { desc = "Go right" })

-- Wrapped lines: move by screen line, not file line
map({ "n", "x" }, "j", "v:count == 0 ? 'gj' : 'j'", { expr = true, silent = true })
map({ "n", "x" }, "k", "v:count == 0 ? 'gk' : 'k'", { expr = true, silent = true })

-- Clear search highlight
map("n", "<Esc>", "<cmd>nohlsearch<cr>", { desc = "Clear search highlight" })

-- Tabs (bar appears only with 2+ tabs; labels in config/tabline.lua)
-- gt / gT also work natively. Numbers match the tabline labels.
map("n", "]t", "<cmd>tabnext<cr>", { desc = "Next tab" })
map("n", "[t", "<cmd>tabprevious<cr>", { desc = "Previous tab" })
map("n", "<leader>te", "<cmd>tabedit<cr>", { desc = "New tab" })
map("n", "<leader>tx", "<cmd>tabclose<cr>", { desc = "Close tab" })
map("n", "<leader>to", "<cmd>tabonly<cr>", { desc = "Close other tabs" })
for i = 1, 9 do
  map("n", "<leader>t" .. i, i .. "gt", { desc = "Go to tab " .. i })
end

-- Markdown
map("n", "<leader>mp", "<cmd>MarkdownPreviewToggle<cr>", { desc = "Browser markdown preview" })
map("n", "<leader>mm", "<cmd>RenderMarkdown toggle<cr>", { desc = "Toggle inline markdown render" })

-- Diagnostics
map("n", "<leader>cd", vim.diagnostic.open_float, { desc = "Show error under cursor" })
