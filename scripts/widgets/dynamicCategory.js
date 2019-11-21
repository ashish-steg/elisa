define([
    'underscore', 
    'modules/jquery-mozu',
    'modules/api',
    'hyprlive'
], function (
    _, 
    $,
    api,
    Hypr
) {
    $(document).ready(function() {
        var cats = "";
        $(".dynamicCategory").each(function(index, elem){
            cats = "";
            api.request("GET", "/api/commerce/catalog/storefront/categories/"+  $(elem).data("mz-cats")).then(function(resp){
                var dynamicCategoryTemplate = Hypr.getTemplate("modules/dynamicCategoryWidget");

                $(this).html(dynamicCategoryTemplate.render({
                    model: resp
                }));
            }.bind(this));

        });
    });

});