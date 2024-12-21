import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { RequestError } from '@octokit/request-error';
import { FormErrorComponent } from '../../shared/error-toasters/form-error/form-error.component';
import { GeneralMessageErrorComponent } from '../../shared/error-toasters/general-message-error/general-message-error.component';
import { LoggingService } from './logging.service';

export const ERRORCODE_NOT_FOUND = 404;

const FILTERABLE = ['node_modules'];

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService implements ErrorHandler {
  snackBarAutoCloseTime = 3000;

  constructor(private snackBar: MatSnackBar, private logger: LoggingService) {}

  handleError(error: HttpErrorResponse | Error | RequestError, actionCallback?: () => void) {
    this.logger.error('ErrorHandlingService: ' + error);
    if (error instanceof Error) {
      this.logger.debug('ErrorHandlingService: ' + this.cleanStack(error.stack));
    }
    if (error instanceof HttpErrorResponse) {
      this.handleHttpError(error, actionCallback);
    } else if (error.constructor.name === 'RequestError') {
      this.handleHttpError(error as RequestError, actionCallback);
    } else if (typeof error === 'string') {
      this.handleGeneralError(error);
    } else {
      this.handleGeneralError(error.message || JSON.stringify(error));
    }
  }

  // Suggested solution from https://catcher-org.github.io/dg/setting-up.html
  private addAutoClose<T>(snackBarRef: MatSnackBarRef<T>) {
    setTimeout(() => {
      snackBarRef.dismiss();
    }, this.snackBarAutoCloseTime);
  }

  private cleanStack(stacktrace: string): string {
    return stacktrace
      .split('\n')
      .filter((line) => !FILTERABLE.some((word) => line.includes(word))) // exclude lines that contain words in FILTERABLE
      .join('\n');
  }

  // Ref: https://docs.github.com/en/rest/overview/resources-in-the-rest-api#client-errors
  private handleHttpError(error: HttpErrorResponse | RequestError, actionCallback?: () => void): void {
    let snackBarRef = null;

    // Angular treats 304 Not Modified as an error, we will ignore it.
    if (error.status === 304) {
      return;
    }

    if (!navigator.onLine) {
      snackBarRef = this.handleGeneralError('No Internet Connection');
      this.addAutoClose(snackBarRef);
      return;
    }

    switch (error.status) {
      case 500: // Internal Server Error.
        snackBarRef = this.snackBar.openFromComponent(GeneralMessageErrorComponent, { data: error });
        break;
      case 422: // Form errors
        snackBarRef = this.snackBar.openFromComponent(FormErrorComponent, { data: error });
        break;
      case 400: // Bad request
      case 401: // Unauthorized
      case 404: // Not found
        snackBarRef = this.snackBar.openFromComponent(GeneralMessageErrorComponent, { data: error });
        break;
      default:
        snackBarRef = this.snackBar.openFromComponent(GeneralMessageErrorComponent, { data: error });
        return;
    }

    if (snackBarRef) {
      this.addAutoClose(snackBarRef);
    }
  }

  private handleGeneralError(error: string): void {
    const snackBarRef = this.snackBar.openFromComponent(GeneralMessageErrorComponent, { data: { message: error } });
    this.addAutoClose(snackBarRef);
  }

  clearError() {
    this.snackBar.dismiss();
  }
}
