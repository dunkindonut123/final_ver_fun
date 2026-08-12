"use client"

import { useEffect } from "react"

/**
 * Prevents the page from jumping when the mobile keyboard opens.
 * Use on full-screen assignment/game views together with
 * `interactiveWidget: "overlays-content"` on the root viewport.
 */
export function useStableKeyboardViewport(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return

    const html = document.documentElement
    const body = document.body
    const scrollY = window.scrollY

    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    const prevBodyPosition = body.style.position
    const prevBodyTop = body.style.top
    const prevBodyLeft = body.style.left
    const prevBodyRight = body.style.right
    const prevBodyWidth = body.style.width

    html.style.overflow = "hidden"
    body.style.overflow = "hidden"
    body.style.position = "fixed"
    body.style.top = `-${scrollY}px`
    body.style.left = "0"
    body.style.right = "0"
    body.style.width = "100%"

    const pin = () => {
      window.scrollTo(0, 0)
    }

    const vv = window.visualViewport
    vv?.addEventListener("resize", pin)
    vv?.addEventListener("scroll", pin)
    window.addEventListener("focusin", pin)

    return () => {
      vv?.removeEventListener("resize", pin)
      vv?.removeEventListener("scroll", pin)
      window.removeEventListener("focusin", pin)

      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
      body.style.position = prevBodyPosition
      body.style.top = prevBodyTop
      body.style.left = prevBodyLeft
      body.style.right = prevBodyRight
      body.style.width = prevBodyWidth
      window.scrollTo(0, scrollY)
    }
  }, [enabled])
}
