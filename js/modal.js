$(document).ready(function () {
    // Add toast container if not present
    if ($('#toast-container').length === 0) {
        $('body').append('<div id="toast-container"></div>');
    }

    if ($('#dialog-overlay').length === 0) {
        $('body').append(
            '<div id="dialog-overlay">' +
                '<div id="dialog-box">' +
                    '<div id="dialog-title"></div>' +
                    '<div id="dialog-message"></div>' +
                    '<div id="dialog-footer">' +
                        '<button class="btn" id="dialog-cancel-btn">Cancel</button>' +
                        '<button class="btn" id="dialog-confirm-btn">Confirm</button>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    }
});

function showToast(message, type, duration) {
    type     = type     || 'info';
    duration = duration || 4000;

    let titleMap = {
        success: 'Success',
        error  : 'Error',
        warning: 'Warning',
        info   : 'Notice'
    };

    let toastId = 'toast-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    let $toast = $(
        '<div class="toast toast-' + type + '" id="' + toastId + '">' +
            '<div class="toast-body">' +
                '<div class="toast-title">' + titleMap[type] + '</div>' +
                '<div class="toast-message">' + message + '</div>' +
            '</div>' +
            '<button class="toast-close" data-id="' + toastId + '">&times;</button>' +
        '</div>'
    );

    $('#toast-container').append($toast);

    $toast.find('.toast-close').on('click', function () {
        closeToast($(this).data('id'));
    });

    setTimeout(function () {
        closeToast(toastId);
    }, duration);
}

function closeToast(toastId) {
    let $toast = $('#' + toastId);
    if (!$toast.length) return;
    $toast.addClass('toast-hiding');
    setTimeout(function () {
        $toast.remove();
    }, 300);
}

function showConfirm(message, onConfirm, options) {
    options = $.extend({
        title      : 'Confirm Action',
        type       : 'primary',
        confirmText: 'Confirm',
        cancelText : 'Cancel',
        showCancel : true
    }, options || {});

    $('#dialog-title').text(options.title);
    $('#dialog-message').text(message);
    $('#dialog-confirm-btn')
        .text(options.confirmText)
        .attr('class', 'btn btn-' + options.type);

    if (options.showCancel) {
        $('#dialog-cancel-btn').text(options.cancelText).show();
    } else {
        $('#dialog-cancel-btn').hide();
    }

    $('#dialog-overlay').addClass('open');

    $('#dialog-confirm-btn').off('click').on('click', function () {
        closeDialog();
        if (typeof onConfirm === 'function') onConfirm();
    });

    $('#dialog-cancel-btn').off('click').on('click', closeDialog);

    $('#dialog-overlay').off('click.dialog').on('click.dialog', function (e) {
        if ($(e.target).is('#dialog-overlay')) closeDialog();
    });
}

function showAlert(message, options) {
    options = $.extend({
        showCancel : false,
        confirmText: 'OK',
        title      : 'Notice',
        type       : 'primary'
    }, options || {});
    showConfirm(message, null, options);
}

function closeDialog() {
    $('#dialog-overlay').removeClass('open');
}