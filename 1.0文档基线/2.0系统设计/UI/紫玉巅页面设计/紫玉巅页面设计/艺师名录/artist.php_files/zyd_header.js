
/**
 * JS for customer account flyout in head
 */
jQuery(document).ready(function ($) {

    var customerFlyoutVisible = false;
    var timeoutId;
    var overCustomerFlyout = false;

    function hideCustomerFlyout() {
        $('.customer-flyout-container').stop(true, true).fadeOut(200);
        customerFlyoutVisible = false;
    }

    $('.flyout-close').click(function () {
        hideCustomerFlyout();
    });

    $('.persistent-cart .first').hover(function () {
            if (!timeoutId) {
                timeoutId = window.setTimeout(function () {
                    timeoutId = null;
                    overCustomerFlyout = true;
                    $('.customer-flyout-container').stop(true, true).fadeIn(300, function () {
                        customerFlyoutVisible = true;
                    });
                }, 10);
            }
        },
        function () {
            if (timeoutId) {
                window.clearTimeout(timeoutId);
                timeoutId = null;
            } else {
                overCustomerFlyout = false;
                setTimeout(function () {
                    if (!overCustomerFlyout) {
                        hideCustomerFlyout();
                    }
                }, 40);
            }
        });
});

/**
 * JS for top search field animation
 */
jQuery(document).ready(function ($) {
    // safari fix width font-size
    $('#search').focus(function () {
        $(this).animate({ width: '200px' });
        $('#search_mini_form button').animate({ width: 90+ 'px'}).css('font-size', '12px');
    });
    $('#search').blur(function () {
        $(this).animate({ width: '167px' });
        $('#search_mini_form button').animate({ width: '0'}).css('font-size', '0');
    });
});
