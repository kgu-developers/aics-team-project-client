# Astryx component inventory

This is the installed component inventory for `@astryxdesign/core@0.2.0`. Coding agents must consult this file for every UI task before creating native interactive markup, app-local primitives, or custom component CSS.

The inventory describes what Astryx provides, not what apps may import directly. Apps only import audited exports from `@aics/design-system`.

## Already available from `@aics/design-system`

```text
Avatar, Badge, Button, Card, Collapsible, CollapsibleGroup, Divider
EmptyState, IconButton, StatusDot
Tab, TabList
HStack, VStack
Text, Heading
TextInput, TextArea
AstryxThemeProvider, oopTheme
```

Use these exports immediately when they fit the design.

## Installed Astryx components

```text
AlertDialog, AppShell, AspectRatio, Avatar, AvatarGroup
Badge, Banner, Blockquote, Breadcrumbs, Button, ButtonGroup
Calendar, Card, Carousel, Center, Chat, CheckboxInput, CheckboxList
Citation, ClickableCard, Code, CodeBlock, Collapsible, CommandPalette
ContextMenu, DateInput, DateRangeInput, DateTimeInput, Dialog, Divider
DropdownMenu, EmptyState, Field, FieldStatus, FileInput, FormLayout
Grid, HStack, Heading, HoverCard, Icon, IconButton, InputGroup, Item
Kbd, Layer, Layout, Lightbox, Link, List, Markdown, MetadataList
MobileNav, MoreMenu, MultiSelector, NavIcon, NavMenu, NumberInput
Outline, OverflowList, Overlay, Pagination, Popover, PowerSearch
ProgressBar, RadioList, Resizable, Section, SegmentedControl
SelectableCard, Selector, SideNav, Skeleton, Slider, Spinner, Stack
StatusDot, Switch, TabList, Table, Text, TextArea, TextInput, Thumbnail
TimeInput, Timestamp, Toast, ToggleButton, Token, Tokenizer, Toolbar
Tooltip, TopNav, TreeList, Typeahead, VStack, VisuallyHidden
```

Infrastructure/type exports such as `BaseProps`, `InteractiveRoleContext`, `SizeContext`, and component `utils` are intentionally omitted from the selection list.

## Required selection workflow

1. Translate each Figma/UI element into a capability, such as action, navigation, dialog, status, form control, layout, or feedback.
2. Check **Already available** first and import a matching component from `@aics/design-system`.
3. If it is only in **Installed Astryx components**, inspect its public typings under:

   ```text
   packages/design-system/node_modules/@astryxdesign/core/dist/<Component>/index.d.ts
   ```

4. If its real API matches the need, add the narrow component and prop/type re-export to `packages/design-system/src/index.ts`, update the available inventory in this file, `packages/design-system/README.md`, and `packages/design-system/AGENTS.md`, then import it from `@aics/design-system` in the app.
5. If Astryx has no matching capability, decide whether the result is an OOP composition (`apps/oop`) or genuinely domain-neutral UI (`packages/ui`). Record why Astryx was not used in the task worklog.

Do not approximate an Astryx component with a native `<button>`, `<input>`, card-like `<div>`, copied DOM/CSS, or a third-party primitive merely because it has not been re-exported yet.

## Keeping the inventory current

Whenever `@astryxdesign/core` changes version, regenerate the installed names from the package export map and review this file:

```bash
node -e "const p=require('./packages/design-system/node_modules/@astryxdesign/core/package.json'); console.log(Object.keys(p.exports).filter(x=>/^\\.\\/[A-Z]/.test(x)).map(x=>x.slice(2)).join('\\n'))"
```

The installed package and its type declarations remain the source of truth if this document and the dependency disagree.
