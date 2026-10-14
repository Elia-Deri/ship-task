import { Component, input } from '@angular/core';

@Component({
  selector: 'app-hero',
  styleUrl: './hero.css',
  templateUrl: './hero.html',
})
export class Hero {
  readonly isCompact = input(false);
}
