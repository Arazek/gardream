// ─── Admin Dashboard ──────────────────────────────────────────────────────────
export { StatCardComponent, StatCardColor } from './components/stat-card/stat-card.component';
export { DataTableComponent, DataTableColumn, DataTableSortEvent } from './components/data-table/data-table.component';
export { ActionMenuComponent, ActionMenuItem } from './components/action-menu/action-menu.component';
export { DrawerComponent } from './components/drawer/drawer.component';
export { SidebarComponent, SidebarItem } from './components/sidebar/sidebar.component';

// ─── Feedback & State ─────────────────────────────────────────────────────────
export { EmptyStateComponent, EmptyStateVariant } from './components/empty-state/empty-state.component';
export { LoadingSkeletonComponent } from './components/loading-skeleton/loading-skeleton.component';
export { ErrorStateComponent } from './components/error-state/error-state.component';
export { SuccessStateComponent } from './components/success-state/success-state.component';
export { InlineAlertComponent, AlertVariant } from './components/inline-alert/inline-alert.component';

// ─── Overlays & Services ──────────────────────────────────────────────────────
export { ToastService, ToastVariant } from './services/toast.service';
export { ConfirmDialogService, ConfirmOptions } from './services/confirm-dialog.service';
export { LoadingOverlayService } from './services/loading-overlay.service';
export { BottomSheetService, BottomSheetOptions } from './services/bottom-sheet.service';
export { ActionSheetService, ActionSheetOptions } from './services/action-sheet.service';

// ─── Data Display ─────────────────────────────────────────────────────────────
export { AvatarComponent, AvatarSize } from './components/avatar/avatar.component';
export { BadgeComponent, BadgeVariant } from './components/badge/badge.component';
export { ChipComponent, ChipVariant } from './components/chip/chip.component';
export { ChipListComponent } from './components/chip/chip-list.component';

// ─── Lists & Cards ────────────────────────────────────────────────────────────
export { ListItemComponent } from './components/list-item/list-item.component';
export { CardComponent, CardVariant } from './components/card/card.component';
export { SectionComponent } from './components/section/section.component';

// ─── Forms ───────────────────────────────────────────────────────────────────
export { FormFieldComponent } from './components/form-field/form-field.component';
export { SearchBarComponent } from './components/search-bar/search-bar.component';
export { ToggleFieldComponent } from './components/toggle-field/toggle-field.component';
export { SelectFieldComponent, SelectOption } from './components/select-field/select-field.component';
export { TextareaFieldComponent } from './components/textarea-field/textarea-field.component';

// ─── Layout & Media ───────────────────────────────────────────────────────────
export { PageHeaderComponent } from './components/page-header/page-header.component';
export { PageContentComponent } from './components/page-content/page-content.component';
export { PageBodyWrapperComponent } from './components/page-body-wrapper/page-body-wrapper.component';
export { DividerComponent } from './components/divider/divider.component';
export { ImageWithFallbackComponent } from './components/image-with-fallback/image-with-fallback.component';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export { SocialLoginButtonComponent, SocialProvider } from './components/social-login-button/social-login-button.component';
export { LogoComponent, LogoSize } from './components/logo/logo.component';

// ─── Arboretum Components ─────────────────────────────────────────────────────
export { IconContainerComponent, IconContainerSize, IconContainerVariant } from './components/icon-container/icon-container.component';
export { ProgressBarComponent } from './components/progress-bar/progress-bar.component';
export { FilterChipComponent } from './components/filter-chip/filter-chip.component';
export { TaskCardComponent } from './components/task-card/task-card.component';
export { TaskListItemComponent } from './components/task-list-item/task-list-item.component';
export { StatChipComponent } from './components/stat-chip/stat-chip.component';
export { DayPickerComponent } from './components/day-picker/day-picker.component';
export { PlotTypeSelectorComponent, PlotTypeOption } from './components/plot-type-selector/plot-type-selector.component';
export { GardenGridSlotComponent, GridCropInfo } from './components/garden-grid-slot/garden-grid-slot.component';
export { SpecimenCardComponent, SpecimenCardSize } from './components/specimen-card/specimen-card.component';
export { WeatherWidgetComponent, CurrentWeather, DayForecast } from './components/weather-widget/weather-widget.component';
export { InsightCardComponent } from './components/insight-card/insight-card.component';
export { HeroSectionComponent } from './components/hero-section/hero-section.component';
export { TopAppBarComponent } from './components/top-app-bar/top-app-bar.component';
export { BottomNavBarComponent, NavItem } from './components/bottom-nav-bar/bottom-nav-bar.component';

// ─── Pipes ────────────────────────────────────────────────────────────────────
export { TimeAgoPipe } from './pipes/time-ago.pipe';
export { TruncatePipe } from './pipes/truncate.pipe';
export { InitialsPipe } from './pipes/initials.pipe';

// ─── Directives ───────────────────────────────────────────────────────────────
export { AutofocusDirective } from './directives/autofocus.directive';
export { LongPressDirective } from './directives/long-press.directive';
