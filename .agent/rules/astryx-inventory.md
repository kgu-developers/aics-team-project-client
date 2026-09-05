# Astryx inventory

Version-dependent inventory for `@astryxdesign/core@0.2.0`. Selection and styling policy lives in `design-system.md`.

## Exported by `@aics/design-system`

```text
Avatar, Badge, Breadcrumbs, BreadcrumbItem, Button, Card, Carousel, CheckboxList, CheckboxListItem, Collapsible, CollapsibleGroup, Dialog, Divider
EmptyState, Field, FileInput, IconButton, MetadataList, MetadataListItem, Popover, RadioList, RadioListItem, Selector, SelectorOption, StatusDot, Table, ToastViewport, useToast
Tooltip
Tab, TabList
HStack, VStack
Text, Heading
TextInput, TextArea, DateInput, MultiSelector
AstryxThemeProvider, oopTheme, tokens
```

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
MobileNav, MoreMenu, NavIcon, NavMenu, NumberInput
Outline, OverflowList, Overlay, Pagination, Popover, PowerSearch
ProgressBar, RadioList, Resizable, Section, SegmentedControl
SelectableCard, Selector, SideNav, Skeleton, Slider, Spinner, Stack
StatusDot, Switch, TabList, Table, Text, TextArea, TextInput, Thumbnail
TimeInput, Timestamp, Toast, ToggleButton, Token, Tokenizer, Toolbar
Tooltip, TopNav, TreeList, Typeahead, VStack, VisuallyHidden
```

Installed package typings are authoritative when this file drifts. After an Astryx version change, regenerate names and review the public exports:

```bash
node -e "const p=require('./packages/design-system/node_modules/@astryxdesign/core/package.json'); console.log(Object.keys(p.exports).filter(x=>/^\\.\\/[A-Z]/.test(x)).map(x=>x.slice(2)).join('\\n'))"
```
