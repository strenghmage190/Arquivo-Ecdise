# Graph Report - SiteDeInvestigação  (2026-08-16)

## Corpus Check
- 303 files · ~208,759 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1115 nodes · 1762 edges · 135 communities (86 shown, 49 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.54)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 74
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 103
- Community 104
- Community 106
- Community 107

## God Nodes (most connected - your core abstractions)
1. `supabase` - 25 edges
2. `isExtendedPerformanceMode()` - 20 edges
3. `updateInvestigationCard()` - 19 edges
4. `uploadInvestigationImage()` - 17 edges
5. `compilerOptions` - 17 edges
6. `AudioManager` - 16 edges
7. `EventManager` - 15 edges
8. `ModalManager` - 15 edges
9. `getOptimizedInterval()` - 15 edges
10. `uploadInvestigationFile()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `ClueBasicsTab()` --indirect_call--> `basicReducer()`  [INFERRED]
  src/components/modals/tabs/ClueBasicsTab.tsx → src/reducers/clueFormReducer.ts
- `App()` --calls--> `useIsMobile()`  [EXTRACTED]
  src/App.tsx → src/hooks/useIsMobile.ts
- `InvestigationBoard()` --calls--> `fetchConnectionsForInvestigation()`  [EXTRACTED]
  src/components/board/index.tsx → src/api/connections.ts
- `Props` --references--> `InvestigationCard`  [EXTRACTED]
  src/components/modals/InvestigationCardModal.tsx → src/api/investigations.ts
- `Props` --references--> `InvestigationCard`  [EXTRACTED]
  src/components/modals/InvestigationCardModal_Refactored.tsx → src/api/investigations.ts

## Import Cycles
- 3-file cycle: `src/components/LayersPanel.tsx -> src/components/tools/UVEditor.tsx -> src/components/tools/UVEditorInner.tsx -> src/components/LayersPanel.tsx`
- 4-file cycle: `src/components/LayerItem.tsx -> src/components/tools/UVEditor.tsx -> src/components/tools/UVEditorInner.tsx -> src/components/LayersPanel.tsx -> src/components/LayerItem.tsx`
- 4-file cycle: `src/components/LayerPreview.tsx -> src/components/tools/UVEditor.tsx -> src/components/tools/UVEditorInner.tsx -> src/components/LayersPanel.tsx -> src/components/LayerPreview.tsx`

## Communities (135 total, 49 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (47): createClueTemplate(), CreateTemplateInput, deleteClueTemplate(), fetchClueTemplates(), sanitizeTemplateData(), ChatSender, CreateClueModal(), EditingChatMessage (+39 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (50): ClueTemplate, ChatSender, CreateClueModal_Refactored(), EditingChatMessage, ForensicConfig, Props, TABS, ClueAudioTab() (+42 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (38): Props, Props, ShredderPuzzleModal(), AudioForge(), Props, AudioMixer(), Props, CCTVPlayer() (+30 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (33): LayerIcon(), MaskIcon(), LayerItem(), LayerItemProps, LayerPreview(), LayerPreviewProps, LayersPanel(), LayersPanelProps (+25 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (39): axe-core, @excalidraw/excalidraw, lamejs, lodash.throttle, lucide-react, nanoid, dependencies, axe-core (+31 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (25): AudioLab, ActiveTab, AudioLabContent(), AudioLabProps, ColormapName, colormapToScheme(), TABS, AudioLayerPanel() (+17 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (30): GlitchPuzzleSolverLazy, clamp01(), GlitchState, SmoothedValues, useGlitchState(), useSmoothedValues(), buildSeeds(), clamp01() (+22 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (6): SystemOverlays(), AudioManager, EventConfig, EventHandler, EventManager, EventQueue

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (19): Props, AudioViewerModal(), Props, WaveSurferInstance, AdvancedAudioLab(), Props, ProfessionalSpectrogram(), Props (+11 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (23): App(), DisplayConfigPanel(), Props, FileProperties(), FilePropertiesProps, defaultDisplayConfig, DisplayConfig, idbGet() (+15 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (15): ClueConfigTabProps, DisplayConfig, ClueMediaTabProps, CluePreviewTabProps, CluePublishTabProps, ClueValidationTabProps, ValidationError, FieldVisibilityEditor() (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (27): cypress, DOM, ES2020, node, node_modules/react-hot-toast, node_modules/@types, src, src/**/outdated/** (+19 more)

### Community 12 - "Community 12"
Cohesion: 0.07
Nodes (27): author, qs, description, install, keywords, license, main, name (+19 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (19): applyPlugboard(), EnigmaMachine(), REFLECTORS, Rotor, ROTOR_SPECS, RotorSpec, UniversalDecoder(), CipherLib (+11 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (13): CreateClueModalLegacy, Props, TODO: implement pointer/mouse move handlers that update `cards` or a…, BottomNavigationBar(), MOBILE_TOOLS, ConnectionLine(), ConnectionLineProps, InviteModal() (+5 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (12): TabKey, TABS, InvestigationChatTab(), InvestigationChatTabProps, InvestigationMediaTab(), InvestigationMediaTabProps, InvestigationMegaClueTab(), InvestigationMegaClueTabProps (+4 more)

### Community 16 - "Community 16"
Cohesion: 0.21
Nodes (9): EvidenceCardProps, InspectionModalProps, AuthContext, AuthProvider(), useAuth(), ProtectedRoute(), InvitePage(), Login() (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.14
Nodes (8): EvidenceCardProps, EvidenceCardContent(), EvidenceCardContentProps, GlobalMouse, MysteryImage(), Props, Pointer, useThrottledMouse()

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (11): allFiles, conflicts, cssVars, errors, fs, keyframeConflicts, keyframes, path (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.23
Nodes (12): ActiveAgentsHud(), HIGH_CLEARANCE_LEVELS, CLEARANCE_COLORS, CursorOverlay(), HIGH_CLEARANCE_LEVELS, Props, AgentInfo, AgentPresence (+4 more)

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (9): applyPlugboard(), ciphertext, config, decoded, encodeString(), makeRotorsFromLeftToRight(), Rotor, ROTOR_SPECS (+1 more)

### Community 21 - "Community 21"
Cohesion: 0.30
Nodes (11): createInvestigationCard(), deleteInvestigationCard(), fetchCards(), updateInvestigationCard(), emptyInsight(), InvestigationCardModal(), InvestigationCardModal_Refactored(), useEscapeClose() (+3 more)

### Community 22 - "Community 22"
Cohesion: 0.22
Nodes (8): applyPlugboard(), config, encoded, encodeString(), makeRotorsFromLeftToRight(), Rotor, ROTOR_SPECS, stepRotors()

### Community 23 - "Community 23"
Cohesion: 0.30
Nodes (12): applyPreset(), applyPresetVars(), disablePerformanceMode(), enablePerformanceMode(), PerfPreset, Preset, PRESETS, readInitialState() (+4 more)

### Community 24 - "Community 24"
Cohesion: 0.21
Nodes (7): createInvestigation(), createInviteLink(), Desktop(), FileExplorer(), NetUplink(), SystemTerminal(), SystemTerminalProps

### Community 25 - "Community 25"
Cohesion: 0.21
Nodes (8): deleteInvestigation(), Button(), Props, Variant, Home(), fetchCases(), handleCreate(), handleDelete()

### Community 27 - "Community 27"
Cohesion: 0.20
Nodes (3): fetchConnectionsForInvestigation(), Card, Connection

### Community 28 - "Community 28"
Cohesion: 0.27
Nodes (5): debugFetchInvestigationsRest(), fetchInvestigationById(), fetchInvestigationDetails(), fetchOrCreateInvestigationForCampaign(), isValidId()

### Community 29 - "Community 29"
Cohesion: 0.27
Nodes (6): Props, getSupabaseClient(), getSupabaseInstance(), supabase, supabaseAnonKey, supabaseUrl

### Community 30 - "Community 30"
Cohesion: 0.22
Nodes (9): autoprefixer, devDependencies, autoprefixer, stylelint-config-prettier, @testing-library/jest-dom, @types/react, stylelint-config-prettier, @testing-library/jest-dom (+1 more)

### Community 31 - "Community 31"
Cohesion: 0.39
Nodes (6): fetchConspiracyBoard(), saveConspiracyBoard(), ConspiracyBoard(), loadInitialData(), Props, useWindowSize()

### Community 32 - "Community 32"
Cohesion: 0.31
Nodes (7): InvestigationBoard, MobileTestPage(), CardPosition, organizeByElement(), organizeByGroup(), organizeByTimeline(), organizeByVeracity()

### Community 33 - "Community 33"
Cohesion: 0.22
Nodes (3): ColorScheme, FftConfig, WorkerRequest

### Community 34 - "Community 34"
Cohesion: 0.29
Nodes (7): fetchCardsForInvestigation(), InvestigationCard, CardSummary, CreatorHub(), Props, Props, Props

### Community 35 - "Community 35"
Cohesion: 0.29
Nodes (5): GMOverwatchProps, HiddenCard, GMOverwatch, Toast(), ToastProps

### Community 36 - "Community 36"
Cohesion: 0.32
Nodes (5): InvestigationBoard(), applySnapshot(), onKey(), persistPositions(), schedulePersist()

### Community 37 - "Community 37"
Cohesion: 0.25
Nodes (3): ErrorBoundary, Props, State

### Community 38 - "Community 38"
Cohesion: 0.25
Nodes (5): DisplayConfig, EvidenceType, UseCreateClueStateReturn, ValidationItem, ValidationSeverity

### Community 39 - "Community 39"
Cohesion: 0.25
Nodes (7): *.css, *.jpeg, *.jpg, *.png, *.scss, *.svg, Window

### Community 40 - "Community 40"
Cohesion: 0.50
Nodes (7): addDebugPanel(), CardTestData, logAllCards(), logCardInfo(), queryAllCards(), queryCard(), testCard()

### Community 41 - "Community 41"
Cohesion: 0.25
Nodes (5): GlitchPuzzleDataSchema, InsightSchema, InvestigationCardSchema, MegaClueDataSchema, MetadataSchema

### Community 42 - "Community 42"
Cohesion: 0.29
Nodes (6): stylelint-config-standard, extends, rules, at-rule-no-unknown, block-no-empty, color-no-invalid-hex

### Community 44 - "Community 44"
Cohesion: 0.57
Nodes (5): debounce(), DeviceType, useDeviceType(), useIsMobile(), useIsTouchDevice()

### Community 45 - "Community 45"
Cohesion: 0.47
Nodes (3): getInvestigationById, BootScreen(), Investigation()

### Community 46 - "Community 46"
Cohesion: 0.33
Nodes (3): AgentProfile, AgentProfileConfig(), AgentProfileConfigProps

### Community 47 - "Community 47"
Cohesion: 0.33
Nodes (3): MsgIn, MsgOut, SynthParams

### Community 49 - "Community 49"
Cohesion: 0.60
Nodes (4): InvestigationCardInsight, emptyInsight(), InvestigationBasicsTab(), InvestigationBasicsTabProps

### Community 50 - "Community 50"
Cohesion: 0.40
Nodes (4): BootPhase, CodePromptModal(), CodePromptModalProps, CodePromptResult

### Community 51 - "Community 51"
Cohesion: 0.40
Nodes (3): colormapFns, ColormapName, SpectrogramPreviewCanvasProps

### Community 53 - "Community 53"
Cohesion: 0.50
Nodes (3): Props, TerminalSearch(), Window

## Knowledge Gaps
- **335 isolated node(s):** `extends`, `stylelint-config-standard`, `at-rule-no-unknown`, `color-no-invalid-hex`, `block-no-empty` (+330 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `updateInvestigationCard()` connect `Community 21` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 36`, `Community 6`, `Community 15`, `Community 27`, `Community 28`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `supabase` connect `Community 29` to `Community 0`, `Community 1`, `Community 34`, `Community 35`, `Community 2`, `Community 14`, `Community 46`, `Community 16`, `Community 19`, `Community 24`, `Community 25`, `Community 27`, `Community 28`, `Community 31`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `ModalManager` connect `Community 26` to `Community 21`, `Community 15`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `extends`, `stylelint-config-standard`, `at-rule-no-unknown` to the rest of the system?**
  _335 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05357142857142857 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05376972530683811 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05989110707803993 - nodes in this community are weakly interconnected._