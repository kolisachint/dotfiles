-- ~/.config/rex/init.lua — Rex keys, mirroring tmux.conf + herdr config.toml
--
-- Prefix is Ctrl-b, same as herdr (tmux: Ctrl-Space primary + Ctrl-b backup).
-- Switched 2026-11-05 from Ctrl-g to Ctrl-b to match herdr.
-- Ctrl-Space stays free so it reaches nvim completion directly.
-- Press the prefix, let go, then the key. Escape cancels a half-typed prefix.
-- Rex's own Cmd shortcuts (Cmd-D, Cmd-T, Cmd-1..9, Cmd-K …) still work.
--
-- Check edits:  rex config check
-- Apply live:   rex config reload
-- See all keys: rex keymap
-- Cheat sheet:  ~/.config/rex/cheatsheet.txt

local function prefixed(key, action, args)
  rex.bind("ctrl+b>" .. key, action, args)
end

-- Prefix twice sends it on to the app
rex.bind("ctrl+b>ctrl+b", "pane.send_key", { key = "ctrl+b" })

-- ── Splits ─────────────────────────────────────────────────
-- tmux defaults: %  side by side,  "  top / bottom
prefixed("shift+5", "pane.split", { direction = "right" })
prefixed("shift+'", "pane.split", { direction = "down" })
-- herdr: v  side by side,  -  top / bottom
prefixed("v", "pane.split", { direction = "right" })
prefixed("-", "pane.split", { direction = "down" })

-- ── Move between panes ─────────────────────────────────────
-- tmux: arrows, o ;  herdr: h j k l, tab / shift-tab
for dir, keys in pairs({
  left  = { "left", "h" },
  down  = { "down", "j" },
  up    = { "up", "k" },
  right = { "right", "l" },
}) do
  for _, k in ipairs(keys) do
    prefixed(k, "pane.focus", { direction = dir })
  end
end
prefixed("o", "pane.focus_next")
prefixed("tab", "pane.focus_next")
prefixed("shift+tab", "pane.focus_previous")

-- ── Pane actions ───────────────────────────────────────────
prefixed("z", "pane.zoom")                 -- zoom / unzoom
prefixed("x", "pane.close")                -- kill pane
prefixed("f", "pane.float")                -- float pane
prefixed("=", "pane.balance")              -- even out splits
prefixed("shift+[", "pane.move", { direction = "left" })   -- tmux {
prefixed("shift+]", "pane.move", { direction = "right" })  -- tmux }

-- ── Resize ─────────────────────────────────────────────────
-- tmux: prefix Ctrl-arrows (one step per press)
for _, dir in ipairs({ "left", "down", "up", "right" }) do
  prefixed("ctrl+" .. dir, "pane.resize", { direction = dir })
end
-- herdr: prefix r enters resize mode; arrows or h j k l, shift = big steps,
-- = balances, Enter or Escape leaves.
rex.mode("resize", { exclusive = true })
prefixed("r", "client.mode.enter", { name = "resize" })
for dir, keys in pairs({
  left  = { "left", "h" },
  down  = { "down", "j" },
  up    = { "up", "k" },
  right = { "right", "l" },
}) do
  for _, k in ipairs(keys) do
    rex.bind("resize/" .. k, "pane.resize", { direction = dir })
    rex.bind("resize/shift+" .. k, "pane.resize", { direction = dir, amount = 15 })
  end
end
rex.bind("resize/=", "pane.balance")
rex.bind("resize/enter", "client.mode.exit")

-- ── Tabs (tmux windows) ────────────────────────────────────
prefixed("c", "client.tab.new")            -- new tab
prefixed("n", "client.tab.next")
prefixed("p", "client.tab.previous")
prefixed(",", "client.tab.rename")         -- tmux: rename window
prefixed("shift+t", "client.tab.rename")   -- herdr: rename tab
prefixed("shift+x", "client.tab.close")    -- herdr: close tab
prefixed("shift+,", "client.tab.move.backward")  -- <  move tab left
prefixed("shift+.", "client.tab.move.forward")   -- >  move tab right
for i = 1, 9 do
  prefixed(tostring(i), "client.tab.goto", { index = i })
end

-- ── Sessions (herdr workspaces) ────────────────────────────
prefixed("s", "session.switch")            -- tmux: pick a session
prefixed("w", "session.switch")            -- herdr: workspace picker
prefixed("shift+n", "session.new")         -- herdr: new workspace
prefixed("shift+w", "session.rename")      -- herdr: rename workspace
prefixed("shift+d", "session.close")       -- herdr: close workspace
prefixed("shift+9", "session.previous")  -- tmux (
prefixed("shift+0", "session.next")      -- tmux )

-- ── App ────────────────────────────────────────────────────
prefixed("b", "client.sidebar.toggle")     -- herdr: toggle sidebar
prefixed("shift+;", "client.palette.toggle") -- tmux : command prompt
prefixed("/", "client.find.open")          -- search scrollback
prefixed("[", "client.prompt.previous")    -- jump to previous prompt
prefixed("]", "client.prompt.next")
prefixed("shift+r", "client.config.reload") -- herdr: reload config
prefixed("g", "pane.go_to_directory")      -- herdr: goto

-- prefix ? opens the cheat sheet in a floating pane (q closes it),
-- like tmux's rounded popup
rex.action{
  name  = "show_keys",
  title = "Show Rex Cheat Sheet",
  run   = function(ctx, args)
    local _, err = rex.session.new_layer{
      bounds = { 0.15, 0.08, 0.7, 0.84 },
      focus  = true,
      layout = rex.layout.block{
        flavor  = "com.superlogical.terminal.shell",
        options = { command = { "less", os.getenv("HOME") .. "/.config/rex/cheatsheet.txt" } },
      },
    }
    if err ~= nil then error(err, 0) end
  end,
}
prefixed("shift+/", "show_keys")
