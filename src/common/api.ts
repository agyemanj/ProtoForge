/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { queryFactory, bodyFactory } from "@agyemanjp/http"
import { Obj, toSnakeCase } from "@agyemanjp/standard"
import { UserReadonly } from "./types"

export const dataProxiesConst = {
	entity: proxiesByMethod("entity"),
	entityParent: proxiesByMethod("entityParent"),
	field: proxiesByMethod("field"),
	uiConfig: proxiesByMethod("uiConfig"),
	entityListPage: proxiesByMethod("entityListPage"),
	entityEditorPage: proxiesByMethod("entityEditorPage"),
	editorPageTab: proxiesByMethod("editorPageTab"),
	editorPageStep: proxiesByMethod("editorPageStep"),
	menuItem: proxiesByMethod("menuItem"),
	footerLink: proxiesByMethod("footerLink"),
	config: proxiesByMethod("config"),
	user: proxiesByMethod("user"),
	userReadonly: proxiesByMethod("userReadonly"),
	resourceAccessCount: proxiesByMethod("resourceAccessCount"),
} as const

export const proxies = Object.assign(dataProxiesConst as Obj<ReturnType<typeof proxiesByMethod>>, {
	verifyAccount: bodyFactory("post")
		.url("/verify")
		.bodyType<{ emailAddress: string; verificationCode: string; accessLevel: UserReadonly["accessLevel"] }>()
		.headersType<ObjEmpty>()
		.returnType<UserReadonly>(),
})

export function proxiesByMethod<E extends keyof Model, Model extends Obj<any>>(entityName: E) {
	const path = toSnakeCase(entityName)
	return {
		get: queryFactory("get")
			.url(`/api/${path}`)
			.queryType<{ filter?: string }>()
			.headersType<ObjEmpty>()
			.returnType<Model[E][]>(),
		// .route((args) => db.getAsync(entity, args.filter ? JSON.parse(args.filter) : undefined) as any),

		find: queryFactory("get")
			.url(`/api/${path}/:id`)
			.queryType<ObjEmpty>()
			.headersType<ObjEmpty>()
			.returnType<Model[E]>(),
		// .route((args) => db.findAsync(entity, args.id) as any),

		insert: bodyFactory("post")
			.url(`/api/${path}`)
			.bodyType<Model[typeof entityName]>()
			.headersType<ObjEmpty>()
			.returnType<null>(),
		// .route((obj) => (db.insertAsync(entity, obj as any).then(_ => null))),

		update: bodyFactory("put").url(`/api/${path}`).bodyType<Model[E]>().headersType<ObjEmpty>().returnType<null>(),
		// .route((obj) => (db.updateAsync(entity, obj as any).then(_ => null))),

		delete: queryFactory("delete")
			.url(`/api/${path}/:id`)
			.queryType<ObjEmpty>()
			.headersType<ObjEmpty>()
			.returnType<null>(),
		// .route((args) => (db.deleteAsync(entity, args.id).then(_ => null)))
	}
}

type ObjEmpty = { [k in never]: never }
