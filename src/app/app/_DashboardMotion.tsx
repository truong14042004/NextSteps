"use client"

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion"
import { ReactNode, useEffect, useRef } from "react"

export function FadeIn({
  children,
  delay = 0,
  className,
  y = 12,
}: {
  children: ReactNode
  delay?: number
  className?: string
  y?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerGrid({
  children,
  className,
  delay = 0,
  stagger = 0.06,
}: {
  children: ReactNode
  className?: string
  delay?: number
  stagger?: number
}) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function HoverCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function PulseRing({
  children,
  active,
  className,
}: {
  children: ReactNode
  active: boolean
  className?: string
}) {
  return (
    <span className={`relative inline-flex ${className ?? ""}`}>
      {active && (
        <motion.span
          className="absolute inset-0 rounded-full bg-orange-500/30"
          initial={{ scale: 1, opacity: 0.7 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <span className="relative">{children}</span>
    </span>
  )
}

export function AnimatedNumber({
  value,
  duration = 0.9,
  format,
}: {
  value: number
  duration?: number
  format?: (n: number) => string
}) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const motionVal = useMotionValue(0)
  const rounded = useTransform(motionVal, latest =>
    format ? format(latest) : Math.round(latest).toString()
  )

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration,
      ease: "easeOut",
    })
    return () => controls.stop()
  }, [value, duration, motionVal])

  useEffect(() => {
    const unsub = rounded.on("change", v => {
      if (ref.current) ref.current.textContent = v
    })
    return unsub
  }, [rounded])

  return <span ref={ref}>0</span>
}

export function RevealOnScroll({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-50px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function ShimmerCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <motion.div
        className="pointer-events-none absolute inset-y-0 -inset-x-full w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent dark:via-white/5"
        animate={{ x: ["0%", "400%"] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
      />
      {children}
    </div>
  )
}
