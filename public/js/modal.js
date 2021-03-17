$(document).ready(() => {
    const modalBlock = $('.modal-block')
    const viewBlock = modalBlock.find('.view-block')
    const contentBlock = modalBlock.find('.content-block')

    const button = modalBlock.find('button')
    modalBlock.click((e) => {
        hideModal()
    })
    viewBlock.click((e) => {
        e.stopPropagation()
    })

    button.click((e) => {
        hideModal()
    })

    const hideModal = () => {
        modalBlock.hide()
    }
    window.modal = {
        show: (content) => {
            contentBlock.html(content)
            modalBlock.show()
        }
    }
})
