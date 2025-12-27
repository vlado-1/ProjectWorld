import { Directive } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';
import { OnInit } from '@angular/core';

@Directive({ selector: '[runOnInit]' })

export class RunOnInitDirective implements OnInit {
  @Input('runOnInit') data: any;
  @Output() init = new EventEmitter<any>();
  ngOnInit(){ this.init.emit(this.data); }
}
