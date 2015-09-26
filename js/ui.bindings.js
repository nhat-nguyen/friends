$(".information").click(function () {
    //getting the next element
    $content = $(this).next();
    //checking if its already visible
    // if (!($content.is(":visible"))) {
        //no - its hidden - slide all the other open tabs to hide
        // $(".forecast").slideUp("fast", "linear");
        //open up the content needed
        $content.slideToggle(500, 'linear');
    // }
});