-- Language servers (built-in vim.lsp, Neovim 0.11+), autocomplete, formatting.
-- Mason installs the server/formatter binaries into ~/.local/share/nvim/mason.
-- :Mason to browse, :checkhealth vim.lsp to debug.

local servers = {
  "lua_ls", -- Lua
  "vtsls", -- TypeScript / JavaScript
  "basedpyright", -- Python types
  "ruff", -- Python lint
  "marksman", -- Markdown links / headings
  "jsonls", -- JSON
  "yamlls", -- YAML
  "bashls", -- Bash / zsh scripts
}

local tools = { "stylua", "prettierd", "shfmt" } -- formatters (ruff formats Python)

return {
  {
    "mason-org/mason.nvim",
    cmd = "Mason",
    opts = { ui = { border = "rounded" } },
  },

  -- Configs for each server (cmd, filetypes, root markers)
  { "neovim/nvim-lspconfig", lazy = true },

  -- Installs the servers above and enables them with vim.lsp.enable()
  {
    "mason-org/mason-lspconfig.nvim",
    event = { "BufReadPre", "BufNewFile" },
    dependencies = { "mason-org/mason.nvim", "neovim/nvim-lspconfig" },
    config = function()
      require("mason").setup()
      vim.lsp.config("lua_ls", {
        settings = { Lua = { diagnostics = { globals = { "vim" } }, workspace = { checkThirdParty = false } } },
      })
      require("mason-lspconfig").setup({ ensure_installed = servers, automatic_enable = true })
      -- Formatter binaries
      local reg = require("mason-registry")
      reg.refresh(function()
        for _, name in ipairs(tools) do
          local ok, pkg = pcall(reg.get_package, name)
          if ok and not pkg:is_installed() then pkg:install() end
        end
      end)
    end,
  },

  -- Autocomplete popup (LSP, file paths, snippets, words in buffer)
  {
    "saghen/blink.cmp",
    version = "1.*", -- prebuilt fuzzy matcher binary
    event = { "InsertEnter", "CmdlineEnter" },
    opts = {
      keymap = { preset = "default" }, -- Ctrl-y accept, Ctrl-n/p move, Ctrl-space open
      appearance = { nerd_font_variant = "mono" },
      completion = {
        menu = { border = "rounded" },
        documentation = { auto_show = true, auto_show_delay_ms = 300, window = { border = "rounded" } },
      },
      signature = { enabled = true, window = { border = "rounded" } },
      sources = { default = { "lsp", "path", "snippets", "buffer" } },
    },
  },

  -- Format on save
  {
    "stevearc/conform.nvim",
    event = "BufWritePre",
    cmd = "ConformInfo",
    keys = {
      { "<leader>cf", function() require("conform").format({ async = true }) end, desc = "Format file" },
    },
    opts = {
      formatters_by_ft = {
        lua = { "stylua" },
        python = { "ruff_format", "ruff_organize_imports" },
        javascript = { "prettierd" },
        typescript = { "prettierd" },
        javascriptreact = { "prettierd" },
        typescriptreact = { "prettierd" },
        json = { "prettierd" },
        jsonc = { "prettierd" },
        yaml = { "prettierd" },
        markdown = { "prettierd" },
        css = { "prettierd" },
        html = { "prettierd" },
        sh = { "shfmt" },
        bash = { "shfmt" },
      },
      -- Skip formatting with :let g:disable_autoformat = 1 (or b: for one buffer)
      format_on_save = function(buf)
        if vim.g.disable_autoformat or vim.b[buf].disable_autoformat then return end
        return { timeout_ms = 1500, lsp_format = "fallback" }
      end,
    },
  },
}
