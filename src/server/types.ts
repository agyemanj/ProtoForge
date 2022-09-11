import { default as express } from 'express'
import { Method } from "@agyemanjp/http"
import { Obj } from '@agyemanjp/standard'
import { defaultEnv } from '@danfortsystems/protoforge'


/** Env variables available to server */
export type ServerEnv = Obj<string, keyof typeof defaultEnv>

export type ServerArgs = {
	name: string
	routes: Route[],
	port: number | string,
}

export type RouteObject = {
	method: ExpressMethods;
	urls: string[];
	handler: express.Handler;
}
export type RouteTriple = [
	method: ExpressMethods,
	urls: string[],
	handler: express.Handler
]
export type Route = | RouteObject | RouteTriple | express.Handler
export type ExpressMethods = Lowercase<Method> | "use" | "all"

export type MailMessage = {
	from: string, to: string, subject: string
} & ({ text: string } | { html: string })
