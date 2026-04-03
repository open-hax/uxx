(ns devel.ui.primitives.core
  "Core exports for Reagent UI primitives."
  (:require [devel.ui.primitives.button]
            [devel.ui.primitives.badge]
            [devel.ui.primitives.spinner]
            [devel.ui.primitives.card]
            [devel.ui.primitives.modal]
            [devel.ui.primitives.tooltip]
            [devel.ui.primitives.input]
            [devel.ui.primitives.progress]
            [devel.ui.primitives.resizable-pane]
            [devel.ui.primitives.which-key-popup]
            [devel.ui.primitives.inspector-pane]
            [devel.ui.primitives.permission-prompts]
            [devel.ui.primitives.react-reagent-seam]
            [devel.ui.primitives.pagination]))

(def button devel.ui.primitives.button/button)
(def badge devel.ui.primitives.badge/badge)
(def spinner devel.ui.primitives.spinner/spinner)
(def card devel.ui.primitives.card/card)
(def modal devel.ui.primitives.modal/modal)
(def tooltip devel.ui.primitives.tooltip/tooltip)
(def input devel.ui.primitives.input/input)
(def progress devel.ui.primitives.progress/progress)
(def resizable-pane devel.ui.primitives.resizable-pane/resizable-pane)
(def which-key-popup devel.ui.primitives.which-key-popup/which-key-popup)
(def inspector-pane devel.ui.primitives.inspector-pane/inspector-pane)
(def permission-prompts devel.ui.primitives.permission-prompts/permission-prompts)
(def react-reagent-seam devel.ui.primitives.react-reagent-seam/react-reagent-seam)
(def create-adapter devel.ui.primitives.react-reagent-seam/create-adapter)
(def pagination devel.ui.primitives.pagination/pagination)
(def paginate-items devel.ui.primitives.pagination/paginate-items)
(def calculate-total-pages devel.ui.primitives.pagination/calculate-total-pages)
