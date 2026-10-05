# Astryx inventory

Version-dependent inventory for `@astryxdesign/core@0.6.3`. Selection and styling policy lives in `design-system.md`.

## Exported by `@aics/design-system`

```text
AlertDialog, Avatar, Badge, BottomSheet, Breadcrumbs, BreadcrumbItem, Button, Card, Carousel, CheckboxList, CheckboxListItem, Collapsible, CollapsibleGroup, Dialog, Divider
EmptyState, Field, FileInput, IconButton, MetadataList, MetadataListItem, Popover, RadioList, RadioListItem, Selector, SelectorOption, StatusDot, Table, ToastViewport, useToast
Tooltip
Tab, TabList
HStack, VStack
Text, Heading
TextInput, TextArea, NumberInput, DateInput, DateTimeInput, TimeInput, MultiSelector
AstryxThemeProvider, oopTheme, tokens
```

## Installed Astryx components

```text
AlertDialog, AppShell, AspectRatio, Avatar, AvatarGroup, Badge, Banner, Blockquote, BottomSheet
Breadcrumbs, Button, ButtonGroup, Calendar, Card, Carousel, Center, Chat, CheckboxInput, CheckboxList
Citation, ClickableCard, Code, CodeBlock, Collapsible, CommandPalette, ComplexSelector, ContextMenu
DateInput, DateRangeInput, DateTimeInput, Dialog, Divider, DropdownMenu, EmptyState, Field, FieldStatus
FileInput, FormLayout, Grid, HStack, Heading, HoverCard, Icon, IconButton, Indicator, InputGroup
Item, Kbd, Layer, Layout, Lightbox, Link, List, Markdown, MetadataList, MobileNav, MoreMenu
MultiSelector, NavIcon, NavMenu, NumberInput, Outline, OverflowList, Overlay, Pagination, Popover
PowerSearch, ProgressBar, RadioList, Resizable, ScrollableArea, Section, SegmentedControl
SelectableCard, Selector, SideNav, Skeleton, Slider, Spinner, Stack, StatusDot, Stepper, Switch
TabList, Table, Text, TextArea, TextInput, Thumbnail, TimeInput, Timestamp, Toast, ToggleButton
Token, Tokenizer, Toolbar, Tooltip, TopNav, TreeList, Typeahead, VStack, VisuallyHidden
```

Installed package typings are authoritative when this file drifts. After an Astryx version change, regenerate names and review the public exports:

```bash
node -e "const p=require('./packages/design-system/node_modules/@astryxdesign/core/package.json'); console.log(Object.keys(p.exports).filter(x=>/^\\.\\/[A-Z]/.test(x)).map(x=>x.slice(2)).join('\\n'))"
```
