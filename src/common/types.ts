/** The persisted data entities that the app will manage */
export type Entity = {
	id: string
	name: string
	/** The plural name of the entity */
	namePlural: string
	title: string
	description: string
	/** Name of entity that this entity derives from, or extends */
	extends?: string
	readonly?: boolean
}

/** The parent entities, if any, of entities */
export type EntityParent = {
	id: string
	parentEntity: string
}

export type Field = {
	id: string
	name: string
	title: string
	description: string
	/** Other enum field on which applicability of this field is based; useful for implementing sum/union types */
	applicableEnumField: string
	/** Value of the enum field that indicates this field is applicable */
	applicableEnumValue: string
	/** Whether field value is optional */
	optional: boolean
	type:
		| "address"
		| "boolean"
		| "date"
		| "datetime"
		| "email_address"
		| "external_id"
		| "float"
		| "hash"
		| "integer"
		| "internal_id"
		| "long_text"
		| "media"
		| "medium_text"
		| "money_amount"
		| "object_label"
		| "phone_number"
		| "salt"
		| "short_text"
		| "time"
		| "url"
}

/** UI general configuration */
export type UiConfig = {
	id: string
	/** Rendering architecture */
	renderingArchitecture: "isomorphic" | "server" | "client"
	/** Pages architecture */
	pagesArchitecture: "SPA" | "MPA"
	promoContentURL?: string
	/** Whether bread-crumbs are shown for navigation between pages within a hierarchical entity groups */
	breadcrumbs?: boolean
	/** Whether to show a button for back navigation on each page */
	backButton?: boolean
	primaryColor?: string
	secondaryColor?: string
	copyrightNotice?: string
	contactAddress?: string
	/** General orientation of footer elements other than link set; default is vertical */
	footerOrientation: "vertical" | "horizontal"
	instagram: string
	facebook: string
	linkedin: string
	twitter: string
	iosAppStore: string
	googlePlayStore: string
}

/** List page definitions per entities */
export type EntityListPage = {
	id: string
	name: string
	/** The container to use for displaying the entity objects */
	containerKind: "grid" | "list" | "table"
	containerOrientation?: "vertical" | "horizontal"
	/** Comma separated list of fields shown in list/grid template, in roughly the order listed */
	templateFields?: string
	/** Kind of field labels (if any) to be shown; does not apply to table pages */
	templateFieldLabels?: "caption" | "icon"
	/** Configuration for the free-form search box; dynamic => changes to the search text are immediately applied */
	searchBox?: "dynamic" | "lazy" | "none"
	/** Comma separated fields of the object to allow searching by; If missing no search panel is shown */
	searchPanelFields?: string
	/** Position of search panel if shown. Default is left */
	searchPanelPosition?: "left" | "top" | "right" | "bottom"
	initialSortField: string
	initialSortOrder: "ascending" | "descending"
}

/** Editor page definitions for entities */
export type EntityEditorPage = {
	id: string
	name: string
	/** The editor to use for displaying the entity objects */
	kind: "wizard" | "list" | "table"
	/** If the kind is 'form', then this field indicates the number of columns used to arrange the fields. If not provided, the number of columns is dynamically determined by the viewport */
	columns?: number
}

/** Tabs shown in a tab-kind editor page, in the order listed */
export type EditorPageTab = {
	id: string
	title: string
	/** Comma-separated list of names of fields edited in the tab */
	fields: string
}

/** Steps of a wizard-kind editor page, in the order listed */
export type EditorPageStep = {
	id: string
	title: string
	/** Comma-separated list of names of fields edited in the step */
	fields: string
}

/** Media (images, videos, etc) for listings */
export type MenuItem = {
	id: string
	content: MediaRef
}

/** Footer links, organized into sets according to the 'set' property (which is used as the header */
export type FooterLink = {
	id: string
	set: string
	title: string
	link: string
}

/** General spec config */
export type Config = {
	id: string
}

export type User = {
	id: string
	pwdHash: string
	pwdSalt: string
	verificationCode: string
	displayName: string
	emailAddress: string
	companyName: string
	accessLevel: "none" | "dev" | "admin" | "regular"
	/** Timestamp (milliseconds since epoch) when user was verified by email */
	whenVerified?: number
	/** No. of times user has accessed an app - defined resource(useful for conditionally limiting access) */
	resourceAccessCount?: number
}

export type UserReadonly = {
	id: string
	displayName: string
	emailAddress: string
	companyName: string
	accessLevel: "none" | "dev" | "admin" | "regular"
	/** Timestamp (milliseconds since epoch) when user was verified by email */
	whenVerified?: number
	/** No. of times user has accessed an app - defined resource(useful for conditionally limiting access) */
	resourceAccessCount?: number
}

export type ResourceAccessCount = {
	id: string
	resourceCode: string
	resourceType: string
	count: number
}

export type EntityModel = {
	entity: Entity
	entityParent: EntityParent
	field: Field
	uiConfig: UiConfig
	entityListPage: EntityListPage
	entityEditorPage: EntityEditorPage
	editorPageTab: EditorPageTab
	editorPageStep: EditorPageStep
	menuItem: MenuItem
	footerLink: FooterLink
	config: Config
	user: User
	userReadonly: UserReadonly
	resourceAccessCount: ResourceAccessCount
}

export type EntityObject = EntityModel[keyof EntityModel]

type MediaRef = `${"audio" | "video" | "image"}:${string}`
