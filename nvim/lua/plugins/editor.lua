-- Syntax, search, git, editing helpers
return {
  -- Syntax highlighting (main branch = rewritten for Neovim 0.11/0.12;
  -- the old master branch crashes markdown on 0.12)
  {
    "nvim-treesitter/nvim-treesitter",
    branch = "main",
    build = ":TSUpdate",
    lazy = false,
    config = function()
      require("nvim-treesitter").setup({})
      require("nvim-treesitter").install({
        "bash", "css", "html", "javascript", "json", "lua", "markdown",
        "markdown_inline", "python", "toml", "tsx", "typescript", "vim",
        "vimdoc", "yaml", "regex", "diff", "gitcommit",
      })
      -- Start highlighting wherever a parser is available
      vim.api.nvim_create_autocmd("FileType", {
        callback = function() pcall(vim.treesitter.start) end,
      })
    end,
  },

  -- Ctrl-P fuzzy finder (like VSCode/Zed)
  {
    "nvim-telescope/telescope.nvim",
    dependencies = { "nvim-lua/plenary.nvim" },
    cmd = "Telescope",
    keys = {
      { "<C-p>", "<cmd>Telescope find_files<cr>", desc = "Find files" },
      {
        "<leader>ff",
        function()
          require("telescope.builtin").find_files({
            hidden = true,
            find_command = { "rg", "--files", "--hidden", "--glob", "!.git" },
          })
        end,
        desc = "Find file",
      },
      { "<leader>fg", "<cmd>Telescope live_grep<cr>", desc = "Grep" },
      { "<leader>fb", "<cmd>Telescope buffers<cr>", desc = "Open buffers" },
      { "<leader>fr", "<cmd>Telescope oldfiles<cr>", desc = "Recent files" },
      { "<leader>fh", "<cmd>Telescope help_tags<cr>", desc = "Help" },
    },
    opts = {},
  },

  -- Git: see plugins/git.lua

  -- Press ; and wait: popup lists every key
  {
    "folke/which-key.nvim",
    event = "VeryLazy",
    opts = {
      preset = "modern",
      win = { border = "rounded" },
      spec = {
        { "<leader>c", group = "code" },
        { "<leader>f", group = "find" },
        { "<leader>g", group = "git" },
        { "<leader>m", group = "markdown" },
        { "<leader>o", group = "open / play media" },
        { "<leader>q", group = "session" },
        { "<leader>x", group = "errors list" },
      },
    },
  },

  -- Sessions: open files and layout come back per project (state folder, not in the repo)
  {
    "folke/persistence.nvim",
    event = "BufReadPre",
    opts = {},
    keys = {
      { "<leader>qs", function() require("persistence").load() end, desc = "Restore session" },
      { "<leader>qd", function() require("persistence").stop() end, desc = "Don't save session" },
    },
  },

  -- Auto-close brackets and quotes
  { "echasnovski/mini.pairs", event = "InsertEnter", opts = {} },

  -- Surround: sa" add quotes, sd" delete, sr"' replace
  { "echasnovski/mini.surround", event = "VeryLazy", opts = {} },

  -- Error / warning list panel
  {
    "folke/trouble.nvim",
    cmd = "Trouble",
    opts = {},
    keys = {
      { "<leader>xx", "<cmd>Trouble diagnostics toggle<cr>", desc = "All errors (project)" },
      { "<leader>xb", "<cmd>Trouble diagnostics toggle filter.buf=0<cr>", desc = "Errors in this file" },
      { "<leader>xs", "<cmd>Trouble symbols toggle<cr>", desc = "Symbols outline" },
    },
  },
}
