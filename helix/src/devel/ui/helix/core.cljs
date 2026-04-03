(ns devel.ui.helix.core
  "Core exports for Helix UI component library.
   
   This library provides a set of UI components built with Helix,
   a modern ClojureScript interface to React.
   
   Usage:
   ```clojure
   (:require [devel.ui.helix.core :as ui])
   
   ($ ui/button {:variant :primary :on-click handle-click}
      \"Click me\")
   
   ($ ui/card {:variant :elevated}
      ($ ui/card-header {} \"Card Title\")
      ($ ui/card-body {} \"Card content\"))
   ```"
  (:require [devel.ui.helix.primitives.core :as primitives]))

;; Component exports
(def button primitives/button)
(def badge primitives/badge)
(def spinner primitives/spinner)
(def card primitives/card)
(def card-header primitives/card-header)
(def card-body primitives/card-body)
(def card-footer primitives/card-footer)
(def modal primitives/modal)
(def modal-header primitives/modal-header)
(def modal-body primitives/modal-body)
(def modal-footer primitives/modal-footer)
(def tooltip primitives/tooltip)
(def input primitives/input)
(def progress primitives/progress)

;; Component registry for dynamic lookup
(def components
  {:button button
   :badge badge
   :spinner spinner
   :card card
   :card-header card-header
   :card-body card-body
   :card-footer card-footer
   :modal modal
   :modal-header modal-header
   :modal-body modal-body
   :modal-footer modal-footer
   :tooltip tooltip
   :input input
   :progress progress})
