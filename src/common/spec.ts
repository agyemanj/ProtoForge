const specs = {
	name: "ProtoForge",
	description: "SaaS app generator",
	UI: {
		pages: {
			perEntity: {
				rentalListing: {
					objectEditor: {
						kind: "form",
						columns: "dynamic",
					},
					objectListViewer: {
						container: {
							control: "list",
							orientation: "vertical",
							template: {
								fields: ["title", "pricePerPeriod", "basePeriod", "whenPosted", "listingMedia#content"],
								labels: "caption",
							},
						},
					},
				},
				saleListing: {
					objectEditor: {
						kind: "form",
						columns: "dynamic",
					},
					objectListViewer: {
						container: {
							control: "list",
							orientation: "vertical",
							template: {
								fields: [],
							},
						},
					},
				},
				listingMedia: {
					objectEditor: {
						kind: "form",
						columns: "dynamic",
					},
					objectListViewer: {
						container: {
							control: "list",
							orientation: "vertical",
							template: {
								fields: [],
							},
						},
					},
				},
			},
			custom: {
				"404": {},
				splash: {
					slogan: "Supercharge your real estate acquisition",
					description:
						"NxtHaus is your virtual real estate agent that provides superior and fast service, backed by an outstanding human team you can speak to",
					callToAction: "Get Started",
					inputForCTA: {
						name: "search",
						description: "",
					},
					targetUrlForCTA: "/listings",
					smallPrintForCTA: "",
					extraContentUrl: "",
					corporateUsers: [],
				},
				login: {},
				register: {},
				userVerify: {},
				userAccount: {},
			},
		},
		elements: {
			menu: "hierarchical-entity-groups",
			footer: {
				copyright: "© Danfort Systems, LLC. 2022. All rights reserved.",
				linkSets: [
					{
						header: "Company",
						links: [
							{
								title: "About Us",
								url: "/about",
							},
							{
								title: "Contact Us",
								url: "/contact",
							},
							{
								title: "Partners",
								url: "/partners",
							},
							{
								title: "Careers",
								url: "/careers",
							},
							{
								title: "Newsroom",
								url: "/news",
							},
							{
								title: "Blog",
								url: "/blog",
							},
							{
								title: "Events",
								url: "/events",
							},
						],
					},
					{
						header: "Support",
						links: [
							{
								title: "Guides",
								url: "/help/docs",
							},
							{
								title: "Forum",
								url: "/help/forum",
							},
							{
								title: "Chat",
								url: "/help/chat",
							},
							{
								title: "Privacy",
								url: "/privacy",
							},
							{
								title: "Terms",
								url: "/terms",
							},
						],
					},
					{
						header: "Platform",
						links: [
							{
								title: "Developer API",
								url: "/help/api",
							},
							{
								title: "Integrations",
								url: "/help/integrate",
							},
						],
					},
				],
				socialMediaLinks: {
					twitter: "https://twitter.com/nxthaus",
					facebook: "https://www.facebook.com/Mattermost-2300985916642531/",
					instagram: "https://www.instagram.com/zillow",
					linkedin: "https://www.linkedin.com/company/mattermost/",
				},
				mobileAppLinks: {
					iosAppStore: "https://itunes.apple.com/US/app/id914172636",
					googlePlayStore:
						"http://zillow.com/z/buying/app-download?itc=zw_zw_zw_zillow-footer_btn_android-download",
				},
			},
		},
		architecture: {},
	},
	config: {
		dbEngine: "<undefined>",
		packageName: "<undefined>",
		repositoryHost: "github",
		repositoryName: "<undefined>",
		repositoryTeam: "<undefined>",
		deployTo: "heroku",
		deployWith: "protoforge",
		deployToProject: "<undefined>",
		deployToTeam: "<undefined>",
		deployToApp: "<undefined>",
		deployToPipeline: "<undefined>",
		provisionDbFrom: "heroku",
		provisionSmtpFrom: "<undefined>",
		provisionObjectStoreFrom: "<undefined>",
	},
	entities: {
		entity: {
			title: "Entities",
			description: "The persisted data entities that the app will manage",
			namePlural: "entities",
			fields: {
				name: "short_text",
				namePlural: {
					description: "The plural name of the entity",
					type: "short_text",
				},
				title: "medium_text",
				description: "medium_text",
				extends: {
					description: "Name of entity that this entity derives from, or extends",
					type: "short_text",
					optional: true,
				},
				readonly: {
					type: "boolean",
					optional: true,
				},
			},
		},
		entityParent: {
			namePlural: "entityParents",
			title: "Entity Parents",
			description: "The parent entities, if any, of entities",
			fields: {
				parentEntity: "short_text",
			},
			parents: ["entity"],
		},
		field: {
			namePlural: "fields",
			title: "Field",
			fields: {
				name: "short_text",
				title: "medium_text",
				description: "medium_text",
				applicableEnumField: {
					description:
						"Other enum field on which applicability of this field is based; useful for implementing sum/union types",
					type: "short_text",
				},
				applicableEnumValue: {
					description: "Value of the enum field that indicates this field is applicable",
					type: "short_text",
				},
				optional: {
					description: "Whether field value is optional",
					type: "boolean",
				},
				type: [
					"address",
					"boolean",
					"date",
					"datetime",
					"email_address",
					"external_id",
					"float",
					"hash",
					"integer",
					"internal_id",
					"long_text",
					"media",
					"medium_text",
					"money_amount",
					"object_label",
					"phone_number",
					"salt",
					"short_text",
					"time",
					"url",
				],
			},
			parents: ["entity"],
		},
		uiConfig: {
			namePlural: "uiConfig",
			title: "UI Configuration",
			description: "UI general configuration",
			fields: {
				renderingArchitecture: {
					description: "Rendering architecture",
					type: ["isomorphic", "server", "client"],
				},
				pagesArchitecture: {
					description: "Pages architecture",
					type: ["SPA", "MPA"],
				},
				promoContentURL: {
					type: "url",
					optional: true,
				},
				breadcrumbs: {
					description:
						"Whether bread-crumbs are shown for navigation between pages within a hierarchical entity groups",
					type: "boolean",
					optional: true,
				},
				backButton: {
					description: "Whether to show a button for back navigation on each page",
					type: "boolean",
					optional: true,
				},
				primaryColor: {
					type: "short_text",
					optional: true,
				},
				secondaryColor: {
					type: "short_text",
					optional: true,
				},
				copyrightNotice: {
					type: "short_text",
					optional: true,
				},
				contactAddress: {
					type: "short_text",
					optional: true,
				},
				footerOrientation: {
					description: "General orientation of footer elements other than link set; default is vertical",
					type: ["vertical", "horizontal"],
				},
				instagram: "url",
				facebook: "url",
				linkedin: "url",
				twitter: "url",
				iosAppStore: "url",
				googlePlayStore: "url",
			},
		},
		entityListPage: {
			namePlural: "entityListPages",
			title: "Entity List Page",
			description: "List page definitions per entities",
			fields: {
				name: "short_text",
				containerKind: {
					description: "The container to use for displaying the entity objects",
					type: ["grid", "list", "table"],
				},
				containerOrientation: {
					type: ["vertical", "horizontal"],
					optional: true,
				},
				templateFields: {
					description:
						"Comma separated list of fields shown in list/grid template, in roughly the order listed",
					type: "long_text",
					optional: true,
				},
				templateFieldLabels: {
					description: "Kind of field labels (if any) to be shown; does not apply to table pages",
					type: ["caption", "icon"],
					optional: true,
				},
				searchBox: {
					description:
						"Configuration for the free-form search box; dynamic => changes to the search text are immediately applied",
					type: ["dynamic", "lazy", "none"],
					optional: true,
				},
				searchPanelFields: {
					description:
						"Comma separated fields of the object to allow searching by; If missing no search panel is shown",
					type: "long_text",
					optional: true,
				},
				searchPanelPosition: {
					description: "Position of search panel if shown. Default is left",
					type: ["left", "top", "right", "bottom"],
					optional: true,
				},
				initialSortField: "short_text",
				initialSortOrder: ["ascending", "descending"],
			},
			parents: ["entity"],
		},
		entityEditorPage: {
			namePlural: "entityEditorPages",
			title: "Entity Editor Page",
			description: "Editor page definitions for entities",
			fields: {
				name: "short_text",
				kind: {
					description: "The editor to use for displaying the entity objects",
					type: ["wizard", "list", "table"],
				},
				columns: {
					description:
						"If the kind is 'form', then this field indicates the number of columns used to arrange the fields. If not provided, the number of columns is dynamically determined by the viewport",
					type: "integer",
					optional: true,
				},
			},
			parents: ["entity"],
		},
		editorPageTab: {
			namePlural: "editorPageTabs",
			description: "Tabs shown in a tab-kind editor page, in the order listed",
			fields: {
				title: "short_text",
				fields: {
					description: "Comma-separated list of names of fields edited in the tab",
					type: "short_text",
				},
			},
			parents: ["entityEditorPage"],
		},
		editorPageStep: {
			namePlural: "editorPageSteps",
			description: "Steps of a wizard-kind editor page, in the order listed",
			fields: {
				title: "short_text",
				fields: {
					description: "Comma-separated list of names of fields edited in the step",
					type: "short_text",
				},
			},
			parents: ["entityEditorPage"],
		},
		menuItem: {
			description: "Media (images, videos, etc) for listings",
			namePlural: "listingMedia",
			fields: {
				content: "media",
			},
			readonly: false,
			parents: ["rentalListing", "saleListing"],
		},
		footerLink: {
			namePlural: "footerLinks",
			description:
				"Footer links, organized into sets according to the 'set' property (which is used as the header",
			fields: {
				set: "short_text",
				title: "short_text",
				link: "url",
			},
		},
		config: {
			namePlural: "config",
			description: "General spec config",
			fields: {},
		},
		user: {
			namePlural: "users",
			extends: "userReadonly",
			fields: {
				pwdHash: "hash",
				pwdSalt: "salt",
				verificationCode: "medium_text",
			},
		},
		userReadonly: {
			namePlural: "usersReadonly",
			fields: {
				displayName: "short_text",
				emailAddress: "email_address",
				companyName: "long_text",
				accessLevel: ["none", "dev", "admin", "regular"],
				whenVerified: {
					optional: true,
					type: "datetime",
					description: "Timestamp (milliseconds since epoch) when user was verified by email",
				},
				resourceAccessCount: {
					description:
						"No. of times user has accessed an app - defined resource(useful for conditionally limiting access)",
					optional: true,
					type: "integer",
				},
			},
		},
		resourceAccessCount: {
			namePlural: "resourceAccessCounts",
			fields: {
				resourceCode: "short_text",
				resourceType: "short_text",
				count: "integer",
			},
			parents: ["user"],
			uniqueKeys: [
				{
					fields: ["resourceCode"],
					scope: {
						parents: ["user"],
					},
				},
			],
		},
	},
}

export default specs
