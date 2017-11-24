import Element from 'can-element'
import { component } from './component'
class Component extends Element {
  get static view() {
    return component.view(component.ViewModel)
  }
}

document.defineElement(component.tag, Component)
