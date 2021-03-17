$(document).ready(() => {
    let draftGrp = {}
    const drftDom = $('#draft-container')
    const buttonActions = {
        approval: () => {
            const footS = $('<div class="foot-square"></div>')
            const approve = $('<div class="approve action-item">Approve</div>')
            const deny = $('<div class="deny action-item">Deny</div>')
            footS.append(approve)
            footS.append(deny)
            approve.click(e => approveApi(e))
            deny.click(e => denyApi(e))
            return footS
        },
        deletion: () => {
            const footS = $('<div class="foot-square"></div>')
            const deleteI = $('<div class="delete action-item"> Delete</div>')
            footS.append(deleteI)
            deleteI.click(e => deleteApi(e))
            return footS
        },
        hold: () => {}
    }
    const alignDomData = (ele, data, key) => {
        const domCollection = $("<div class='draft-item-wrapper'></div>")
        data.forEach((it) => {
            const domData = $(`<div class='draft-item' data-id='${it._id}'></div>`)
            // let domRenderTemp = $(`<div class="status-item-wrap"> <span>Draft Name:</span> ${it.name}`);
            const domRender = $(`<div class="status-item-wrap"> </div>`)
            domRender.append(`<span>Draft Name:</span> ${it.name}<br>`)
            domRender.append(`<span>Image count:</span> ${it.imageInputs.length - 1}<br>`)
            domRender.append(`<span>Contributor:</span> ${it.user.name}<br>`)
            domRender.append(`<span>Created at:</span> ${new Date(it.createdAt)}<br>`)
            domData.append(domRender)
            domData.append(buttonActions[key]())
            domCollection.append(domData)
            domData.click((e) => {
                window.location.href = `/account/draft/edit/${it._id}`
            })
        })

        ele.append(domCollection)

        return ele
    }

    const renderDom = () => {
        drftDom.empty()
        Object.keys(draftGrp).forEach((key) => {
            const col = $(`<div class="dCol col-sm-4"><h3>${key.toUpperCase()}</h3></div>`)
            const colData = $('<div class="colData"></div>')
            col.append(alignDomData(colData, draftGrp[key], key))
            drftDom.append(col)
        })
    }

    const formRenderData = (drafts) => {
        draftGrp = {}
        draftGrp.approval = drafts.filter(i => i.status === 'approval')
        draftGrp.deletion = drafts.filter(i => i.status === 'deletion')
        draftGrp.hold = drafts.filter(i => i.status === 'hold')
        renderDom()
    }

    if (window.location.pathname === "/account/admin/drafts") {
        // formRenderData(window.drafts)
        $.get('/account/admin/drafts/', (res2) => {
            formRenderData(res2.data)
        })
    }

    const approveApi = (e) => {
        const pObj = $(e.currentTarget).parent().parent().data('id')
        e.stopPropagation()
        $.get(`/account/draft/create/mural/${pObj}`, (res) => {
            if (!res.error) {
                const content = `<p>Draft converted to mural :: ${res.data}</p>`
                window.modal.show(content)
                $.get('/account/admin/drafts/', (res2) => {
                    formRenderData(res2.data)
                })
            } else {
                const content = `<p>There was an error creating a mural from draft ${pObj} </p>`
                window.modal.show(content)
            }
        })
    }

    const denyApi = (e) => {
        const pObj = $(e.currentTarget).parent().parent().data('id')
        e.stopPropagation()

        $.get(`/account/draft/set/status/hold/${pObj}`, (res) => {
            $.get('/account/admin/drafts/', (res2) => {
                const content = `<p>Status change has been recorded </p>`
                window.modal.show(content)
                formRenderData(res2.data)
            })
        })
    }
    const deleteApi = (e) => {
        const pObj = $(e.currentTarget).parent().parent().data('id')
        e.stopPropagation()

        $.get(`/account/draft/set/archive/true/${pObj}`, (res) => {
            $.get('/account/admin/drafts/', (res2) => {
                const content = `<p>Status change has been been to archive this draft </p>`
                window.modal.show(content)
                formRenderData(res2.data)
            })
        })
    }
})
