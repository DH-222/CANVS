$(document).ready(() => {
    // Place JavaScript code here...
    const card = $('.mural-card')
    const artCard = $('.artist-card')
    // const formDeletePost = $('.form-handle')
    const deleteButton = $('.delete-button')
    const postButton = $('.post-button')
    const buttonSort = $('a.btn.btn-primary')
    const isDelete = $('.isDelete')
    const gotoBut = $('.btn-go')
    const gotoVal = $('.go-to')
    const cards = $('.card')
    const dropThumbid = ''

    card.click((evt) => {
        window.selection = 45
        window.location = `/account/murals/edit/${$(evt.currentTarget).data('id')}`
    })

    artCard.click((evt) => {
        window.selection = 45
        window.location = `/account/artists/edit/${$(evt.currentTarget).data('id')}`
    })

    gotoBut.click((evt) => {
        const val = $(`#${gotoVal.val()}`)
        // console.log('valuezzz: -- ', val)
        cards.removeClass('gotoselected')
        val.addClass('gotoselected')
        $('html, body').animate({
            scrollTop: val.offset().top - 140
        }, 700)
    })
    cards.mouseleave((evt) => {
        cards.removeClass('gotoselected')
    })
    gotoVal.keyup((evt) => {
        console.log(evt.which)
        if (evt.which === 13) {
            const val = $(`#${gotoVal.val()}`)
            // console.log('valuezzz: -- ', val)
            cards.removeClass('gotoselected')
            val.addClass('gotoselected')
            $('html, body').animate({
                scrollTop: val.offset().top - 140
            }, 700)
        }
    })

    $('.lazy').Lazy()
    // buttonSort.click((evt) => {
    //     // evt.preventDefault()
    //     // console.log('Ecvetn: -- ', evt)
    //     // window.location.href = evt.currentTarget.href
    // })
    deleteButton.hover((evt) => {
        isDelete.val(1)
        // evt.preventDefault()
        // formDeletePost[0].method = 'delete'
        // $(formDeletePost).attr('method', 'DELETE')
        console.log('formDeletPost: -- ')
        // formDeletePost[0].submit()
    })

    postButton.hover((evt) => {
        isDelete.val(0)
        // evt.preventDefault()
        // formDeletePost[0].method = 'delete'
        // $(formDeletePost).attr('method', 'DELETE')
        console.log('formDeletPost: -- ')
    // formDeletePost[0].submit()
    })
    $('#datepicker').datepicker()
    const modalBlock = $('modal-block')
    const liveCallout = $('.live-callout')
    liveCallout.find('i').click((e) => {
        liveCallout.hide()
    })
    const removeModelApiCall = (data, cb) => {
        $.ajax({
            url: '/remove/model/mural/',
            type: 'DELETE',
            data,
            success: cb,
            error: () => {

            }
        })
        // cb('Return will work')
    }
    if (window.location.pathname.indexOf('account/murals/edit/') > -1) {
        const removeImage = $('.remove-image')

        const successFullImageRemoveal = ele => (result) => {
            const thumbData = $('#mainThumb')
            if (ele.data('thumb') === thumbData.attr('value')) {
                // debugger;;
                ele.parent().remove()
                const muralImagePreview = $('.set-images')
                const mP = muralImagePreview.children()
                const thumbId = (mP.length) ? $(mP[0].children[1]).data('thumb') : 0
                thumbData.attr('value', thumbId)
                $(mP[0]).find('.fa-thumbs-up').addClass('show')
            }
            console.log('Result: -- ', ele, result, ele.data('thumb'), thumbData.attr('value'))
        }
        removeImage.click((e) => {
            const cD = $(e.currentTarget)
            const muralD = {
                muralId: cD.data('mural'),
                modelId: cD.data('mid'),
                modelType: 'image'
            }
            removeModelApiCall(muralD, successFullImageRemoveal(cD))
            // console.log('data curry', successFullImageRemoveal(cD))
        })

    // formRenderData(window.drafts)
    // $.get('/account/admin/drafts/', (res2) => {
    //   formRenderData(res2.data)
    // })
    }

    if (window.location.pathname.indexOf('/account/artists/edit/') > -1) {
        const removeImage = $('.remove-image')
        removeImage.click((e) => {
            removeImage.parent().remove()
        })
    }
})
