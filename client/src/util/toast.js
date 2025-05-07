// toast.js
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';

// Configure toastr immediately when the module loads.
toastr.options = {
  closeButton: true,
  progressBar: true,
  positionClass: 'toast-top-right',
  timeOut: "3000"
};

export function success(message, title = 'Success') {
  toastr.success(message, title);
}

export function error(message, title = 'Error') {
  toastr.error(message, title);
}

export function info(message, title = 'Info') {
  toastr.info(message, title);
}

export function warning(message, title = 'Warning') {
  toastr.warning(message, title);
}
