$(document).ready(function () {
    $('.deleteRequest').on('submit', function (event) {
        event.preventDefault();
        var url = $(this).attr('action');
        $('#deleteModal').modal('show');
        $('#deleteForm').attr("action", url);
    });
});