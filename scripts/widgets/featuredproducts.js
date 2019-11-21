define([
    'modules/jquery-mozu'
], function (
    $
) {
    $(document).ready(function() {
        $(".featuredProducts img").each(function(){
            $(this).attr("src", $(this).data("src"));
        });
    });

});