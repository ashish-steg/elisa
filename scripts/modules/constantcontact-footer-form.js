require(["modules/jquery-mozu", "underscore", "hyprlive"], function ($, _, Hypr) {
    $(document).ready(function() {
        var localizedErrMap = {};

        localizedErrMap.required        =        'This field is required.';
        localizedErrMap.ca              =          'An unexpected error occurred while attempting to send email.';
        localizedErrMap.email           =           'Please enter your email address in name@email.com format.';
        localizedErrMap.birthday        =        'Please enter birthday in MM/DD format.';
        localizedErrMap.anniversary     =     'Please enter anniversary in MM/DD/YYYY format.';
        localizedErrMap.custom_date     =     'Please enter this date in MM/DD/YYYY format.';
        localizedErrMap.list            =            'Please select at least one email list.';
        localizedErrMap.generic         =         'This field is invalid.';
        localizedErrMap.shared          =      'Sorry, we could not complete your sign-up. Please contact us to resolve this.';
        localizedErrMap.state_mismatch  = 'Mismatched State/Province and Country.';
        localizedErrMap.state_province  = 'Select a state/province';
        localizedErrMap.selectcountry   =   'Select a country';

        var postURL = 'https://visitor2.constantcontact.com/api/signup',
            errClass = 'is-error',
            msgErrClass = 'ctct-form-errorMessage';

        localizedErrMap.unsubscribed = 'Sorry, you were previously unsubscribed from our lists. Please contact us to subscribe again.';

        $.support.cors = true;

        if (typeof postURL === 'undefined') {
            postURL = 'https://visitor2.constantcontact.com/api/signup';
        }

        var _form = $('[data-id="embedded_signup:form"]');

        _form.on('submit', function (e) {
            e.preventDefault();

            /* Generate the serialized payload and hash to map with */
            var payload = $(this).serialize(),
                payload_check = payload.split('&'),
                payload_check_hash = {};

            /* Populate the hash with values */
            var i, j;
            var field,
                redirect = false,
                redirect_url = '';

            for (i = i; i < payload_check.length; i++) {
                var p = payload_check[i].split('=');

                if (p[0].lastIndexOf('list_', 0) === 0) {
                    p[0] = 'list';
                }

                payload_check_hash[p[0]] = p[1];
            }

            /* Clear any errors that may have been set before */
            _form.find('.' + msgErrClass).remove();
            _form.find('.' + errClass).removeClass(errClass);
            _form.find('.ctct-flagged').removeClass('ctct-flagged');

            /* This is the only client side verification */
            var isError = false;

            /* Clean custom fields if needed (hint: not needed bc we have no custom fields) */
            var payload_clean = payload.split('&');
            var id,
                item,
                custom_data_to_clean = {};

            payload_clean = payload_clean.filter(function (n) {
                return n !== undefined;
            });

            for (i in custom_data_to_clean) {
                /* Loop over the payload and remove the fields that match our scrub needs */
                for (j = 0; j < payload_clean.length; j++) {
                    item = payload_clean[j];

                    if (item) {
                        item = item.split('=');

                        /* Match based off field id */
                        if (item[0].match(new RegExp('.*--' + i, 'i'))) {
                            /* If the value is a bool then we are dealing with text */
                            if (custom_data_to_clean[i] === true) {
                                delete payload_clean[j];
                            }
                        }
                    }
                }
            }

            payload_clean = payload_clean.filter(function (n) {
                return n !== undefined;
            }).join('&');

            $.ajax({
                type: 'POST',
                crossDomain: true,
                url: postURL,
                data: payload_clean,
                error: function (xhr, status, err) {
                    var json = xhr.responseJson;

                    if (json) {
                        if (json.offenders) {
                            for (var i in json.offenders) {
                                var item        = json.offenders[i],
                                    offender    = item.offender,
                                    required    = item.required,
                                    inputUI     = _form.find('[name=' + offender + ']'),
                                    labelUI     = null,
                                    p           = inputUI.parent('p');

                                if (p.length === 0) {
                                    labelUI = _form.find('[data-name=' + offender + ']');

                                    /* If the offender is unsubscribed, have the error message above the email. */
                                    if (offender === 'unsubscribed') {
                                        labelUI = _form.find('[data-name=email]');
                                    }

                                    if (labelUI.length === 0) {
                                        continue;
                                    }
                                } else {
                                    labelUI = p.find('label');
                                }

                                if (offender === 'email' || offender === 'unsubscribed') {
                                    if (!labelUI.hasClass('ctct-flagged')) {
                                        if (offender === 'email') {
                                            labelUI.after(errorSection('email'));
                                        } else {
                                            labelUI.after(errorSection('unsubscribed'));
                                        }
                                    }
                                } else if (offender.match(/list.*/)) {
                                    if (!labelUI.hasClass('ctct-flagged')) {
                                        labelUI.after(errorSection('list'));
                                    }
                                } else {
                                    if (!labelUI.hasClass('ctct-flagged')) {
                                        labelUI.after(errorSection('generic'));
                                    }
                                }
                                inputUI.addClass(errClass);
                                labelUI.addClass('ctct-flagged');
                            }
                        } else {
                            _form.prepend(errorSection('shared'));
                        }
                    }
                },
                success: function (data, status, xhr) {
                    /* If there is no redirect, display success message as usual */
                    if (redirect === false) {
                        $('.ctct-embed-signup form').hide();
                        $('#success_message').removeClass('u-hide');
                        $('#success_message').show();
                    } else {
                        window.location.href = redirect_url;
                    }
                }
            });

            return false;
        });

        function errorSection(errorType) {
            return '<div class="' + msgErrClass + '">' + localizedErrMap[errorType] + '</div>';
        }
    });
});