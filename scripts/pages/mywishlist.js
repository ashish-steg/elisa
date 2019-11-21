define(['modules/backbone-mozu', 'modules/api', 'hyprlive', 'hyprlivecontext', 'modules/jquery-mozu', 'underscore', 'modules/models-customer', 'modules/views-paging', 'modules/editable-view'], function(Backbone, api, Hypr, HyprLiveContext, $, _, CustomerModels, PagingViews, EditableView) {
    $(document).ready(function () {
        console.log('o hai');
        $('#remove-wishlist-item').load(function () {
            $('#remove-wishlist-item').on('click', function (e) {
                e.preventDefault();
                $('.mz-remove-wishlist-confirm > .modal > input[name="data-mz-item-id"]').val($(this).attr('data-mz-item-id'));
                $('.mz-remove-wishlist-confirm').show();
            });
        });
    });
});