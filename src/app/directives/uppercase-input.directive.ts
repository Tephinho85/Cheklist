import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { converterParaMaiusculo } from '../utils/text-normalization';

interface UppercaseInputElement extends HTMLElement {
  value: string;
}

interface IonicInputEvent extends CustomEvent<{ value?: string | null }> {
}

@Directive({
  selector: '[appUppercase]',
  standalone: true
})
export class UppercaseInputDirective {
  private readonly element = inject(ElementRef<UppercaseInputElement>);
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  @HostListener('ionInput', ['$event'])
  onIonInput(event: Event): void {
    if (!(event instanceof CustomEvent)) return;
    const ionicEvent = event as IonicInputEvent;
    const value = converterParaMaiusculo(ionicEvent.detail?.value);
    if (value === (ionicEvent.detail?.value || '')) return;

    if (ionicEvent.detail) ionicEvent.detail.value = value;
    this.element.nativeElement.value = value;
    this.ngControl?.control?.setValue(value, { emitEvent: false });
  }
}
