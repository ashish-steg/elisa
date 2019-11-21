/**
 * Watches for changes to the quantity of items in the shopping cart, to update
 * cart count indicators on the storefront.
 */
define(['modules/jquery-mozu', 'modules/api', 'modules/cart-monitor'], function ($, api, CartModels) {

    var $cartCount,
        user = require.mozuData('user'),
        userId = user.userId,
        $document = $(document),
        CartMonitor = {
            setCount: function(count) {
                this.$el.text(count);
                savedCounts[userId] = count;
                $.cookie('mozucartcount', JSON.stringify(savedCounts), { path: '/' });
            },
            addToCount: function(count) {
                this.setCount(this.getCount() + count);
            },
            getCount: function() {
                return parseInt(this.$el.text(), 10) || 0;
            },
            update: function() {
                api.get('cartsummary').then(function(summary) {
                    $document.ready(function() {
                        CartMonitor.setCount(summary.count());
                    });
                });
            }
        },
        savedCounts,
        savedCount;

    try {
        savedCounts = JSON.parse($.cookie('mozucartcount'));
    } catch(e) {}

    if (!savedCounts) savedCounts = {};
    savedCount = savedCounts && savedCounts[userId];

    if (isNaN(savedCount)) {
        CartMonitor.update();
    }

    $document.ready(function () {
        if(!savedCount){
            savedCount = 0;
        }
        CartMonitor.$el = $('[data-mz-role="cartmonitor"]').html('<span class="cart-monitor-bracket bracket-left">(</span>' + savedCount + '<span class="cart-monitor-bracket bracket-right">)</span>' || '<span class="cart-monitor-bracket bracket-left">(</span>' + 0 + '<span class="cart-monitor-bracket bracket-right">)</span>');
    });

    return CartMonitor;

});