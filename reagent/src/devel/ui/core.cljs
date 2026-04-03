(ns devel.ui.core
  "Core exports for Reagent UI component library."
  (:require [devel.ui.primitives.core :as primitives]))

(def button primitives/button)
(def badge primitives/badge)
(def spinner primitives/spinner)
(def card primitives/card)
(def modal primitives/modal)
(def tooltip primitives/tooltip)
(def input primitives/input)
(def progress primitives/progress)
(def resizable-pane primitives/resizable-pane)
(def which-key-popup primitives/which-key-popup)
(def inspector-pane primitives/inspector-pane)
(def permission-prompts primitives/permission-prompts)
(def react-reagent-seam primitives/react-reagent-seam)
(def create-adapter primitives/create-adapter)

(def components
  {:button button
   :badge badge
   :spinner spinner
   :card card
   :modal modal
   :tooltip tooltip
   :input input
   :progress progress
   :resizable-pane resizable-pane
   :which-key-popup which-key-popup
   :inspector-pane inspector-pane
   :permission-prompts permission-prompts
   :react-reagent-seam react-reagent-seam})
