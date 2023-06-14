import {Injectable} from '@angular/core';

/**
 * Class for managing stylesheets.
 */
@Injectable({
  providedIn: 'root'
})
export class StyleService {
  private readonly htmlElement = document.querySelector('html');

  toggleDarkTheme() {
    this.htmlElement.classList.toggle('dark-theme');
  }
}
