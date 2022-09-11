/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-vars, brace-style */

// import * as srcMapSupport from 'source-map-support'
// srcMapSupport.install({ environment: 'browser' })

import { Base64 } from 'js-base64'
import { ArgsType } from '@agyemanjp/standard'
import { createElement, mountElement } from "@agyemanjp/somatic"
import { layoutComponentFactory } from '@danfortsystems/protoforge'

import { app, proxies as api, pages, pagesConst, Page } from "../common"

(async () => {
	if (typeof document !== "undefined") { // if on client, proceed to mount, otherwise do nothing
		// console.log(`Client script: document is not undefined; setting up DOMContentLoaded listener`)
		document.addEventListener("DOMContentLoaded", async (event) => {
			// console.log(`DOMContentLoaded on client; proceeding to mount root component`)

			const rootContainerNode = document.getElementById("root")
			if (!rootContainerNode) throw new Error(`Root container with id "root" not found`)

			const injectedServerInfoString = rootContainerNode.getAttribute("data-req-info")
			if (!injectedServerInfoString) throw new Error(`Server injected info not provided to client script`)
			// console.log(`Server injected info string = ${injectedServerInfoString}`)

			const injectedServerInfo = JSON.parse(Base64.decode(injectedServerInfoString)) as Omit<ArgsType<Page["getProps"]>[0], "api"> & { pageName: keyof typeof pagesConst }
			// console.log(`Injected info from server: ${JSON.stringify(injectedServerInfo, undefined, 2)}`)

			// setClientEnv(injectedServerInfo.env)

			const page = pages[injectedServerInfo.pageName]
			// console.log(`Creating page element on client`)

			const Layout = layoutComponentFactory(app as any).Layout
			const pageElement = await (page.component().then(Comp => Comp
				? <Layout
					user={injectedServerInfo.user}
					showLogin={!["login", "signup"].includes(injectedServerInfo.pageName)}>
					<Comp {...page.getProps({ ...injectedServerInfo, api })} />
				</Layout>
				: null
			))

			// console.log(`Calling mountElement from client on element: ${stringify(pageElement)}`)
			mountElement(pageElement, rootContainerNode)

			// window.onanimationiteration = console.log
		})
	}
})()

