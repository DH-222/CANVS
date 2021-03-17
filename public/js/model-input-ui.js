$(document).ready(() => {
    let aheadData
    const getTypeAheadData = () => $.get('/get/typeahead/').then((results) => {
        console.log(results)
        aheadData = results
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
    }

    const getTypeAheadSelected = select => $.get(`/get/model/${select.model}/${select._id}`).then(result => result)

    const substringMatcher = strs => function findMatches (q, cb) {
        // an array that will be populated with substring matches
        const matches = []

        // regex used to determine if a string contains the substring `q`
        const substrRegex = new RegExp(q, 'i')

        // iterate through the pool of strings and for any string that
        // contains the substring `q`, add it to the `matches` array
        $.each(strs, (i, str) => {
            if (substrRegex.test(str)) {
                matches.push(str)
            }
        })

        cb(matches)
    }

    const artistUI = () => {
        const artistTemp = $('.hidden-artist')
        const artistInitGrp = $('.artist-grp')
        const artistWrapper = $('.artist-wrapper')
        const addArtist = $('.add-artist')
        addArtist.click((e) => {
            const artistGrp = $('.artist-grp')
            if (artistGrp.length) {
                $.each(artistGrp, (i, item) => {
                    if (i === artistGrp.length - 1) {
                        console.log('Inside identifier')
                        addNewArtist(i + 1)
                    }
                })
            } else {
                addNewArtist(0)
            }
        })

        $.each(artistInitGrp, (i, item) => {
            $(item).find('.remove-artist').click(() => {
                const grp = $(item)
                if (window.location.pathname.indexOf('account/murals/edit/') > -1) {
                    const muralD = {
                        muralId: window._id,
                        modelId: grp.data('mid'),
                        modelType: 'artist'
                    }
                    removeModelApiCall(muralD, () => {
                        grp.remove()
                    })
                } else {
                    grp.remove()
                }
            })
        })

        const addNewArtist = (idx) => {
            const artist = aheadData.Artist.map(a => a.name)
            console.log('Artist', artist)
            const newArtist = artistTemp.clone()
            // const group = $(`<div class='artist-grp' data-idx='${idx}'></div>`)
            const artTypeAhead = newArtist.find('.artistName')
            newArtist.find('.artistId').attr('name', `artist[${idx}][_id]`)
            newArtist.find('.artistName').attr('name', `artist[${idx}][name]`)
            newArtist.find('.artistAbout').attr('name', `artist[${idx}][about]`)
            newArtist.find('.facebookLink').attr('name', `artist[${idx}][facebookLink]`)
            newArtist.find('.instagramLink').attr('name', `artist[${idx}][instagramLink]`)
            newArtist.find('.twitterLink').attr('name', `artist[${idx}][twitterLink]`)
            newArtist.find('.youtubeLink').attr('name', `artist[${idx}][youtubeLink]`)
            newArtist.find('.webUrl').attr('name', `artist[${idx}][webUrl]`)
            newArtist.find('.remove-artist').data('idx', idx)
            newArtist.find('h4').text(`Artist ${idx + 1}`)
            newArtist
                .attr('data-idx', idx)
                .removeClass('hide')
                .removeClass('hidden-artist')
                .addClass('artist-grp')

            newArtist.find('.remove-artist').click(() => {
                newArtist.remove()
            })

            $(artTypeAhead).typeahead({
                hint: true,
                highlight: true,
                minLength: 1
            }, {
                name: 'Artist',
                limit: 10,
                source: substringMatcher(artist)
            })

            $(artTypeAhead).bind('typeahead:select', (ev, suggestion) => {
                const select = aheadData.Artist.find(a => a.name === suggestion)
                select.model = 'Artist'
                getTypeAheadSelected(select).then((data) => {
                    console.log('Data from TYpeahead', data)
                    const textArea = newArtist.find('.artistAbout')
                    textArea.text(data.about).attr('readonly', 'readonly')
                    newArtist.find('.artistName').attr('readonly', 'readonly')
                    newArtist.find('.artistId').attr('value', data._id).prop('readonly', 'readonly')
                    newArtist.find('.facebookLink').attr('value', data.facebookLink).prop('readonly', 'readonly')
                    newArtist.find('.instagramLink').attr('value', data.instagramLink).prop('readonly', 'readonly')
                    newArtist.find('.twitterLink').attr('value', data.twitterLink).prop('readonly', 'readonly')
                    newArtist.find('.youtubeLink').attr('value', data.youtubeLink).prop('readonly', 'readonly')
                    newArtist.find('.webUrl').attr('value', data.webUrl).prop('readonly', 'readonly')
                })
            })
            artistWrapper.prepend(newArtist)
        }
    }
    const tagUI = () => {
        const tagTemp = $('.hidden-tag')
        const tagInitGrp = $('.tag-grp')
        const tagWrapper = $('.tags-wrapper')
        const addTag = $('.add-tag')
        addTag.click((e) => {
            const tagGrp = $('.tag-grp')
            if (tagGrp.length) {
                $.each(tagGrp, (i, item) => {
                    if (i === tagGrp.length - 1) {
                        addNewTag(i + 1)
                    }
                })
            } else {
                addNewTag(0)
            }
        })

        $.each(tagInitGrp, (i, item) => {
            $(item).find('.remove-tag').click(() => {
                const grp = $(item)
                if (window.location.pathname.indexOf('account/murals/edit/') > -1) {
                    const muralD = {
                        muralId: window._id,
                        modelId: grp.data('mid'),
                        modelType: 'tag'
                    }
                    removeModelApiCall(muralD, () => {
                        grp.remove()
                    })
                } else {
                    grp.remove()
                }
            })
        })

        const addNewTag = (idx) => {
            console.log(idx)
            const newTag = tagTemp.clone()
            const tagTypeAhead = newTag.find('.tag')
            newTag.find('.tag').attr('name', `tags[${idx}][tag]`)
            newTag.find('.remove-tag').data('idx', idx)
            newTag.find('label').text(`Tag ${idx + 1}`)
            newTag
                .attr('data-idx', idx)
                .removeClass('hide')
                .removeClass('hidden-tag')
                .addClass('tag-grp')
            tagWrapper.prepend(newTag)
            newTag.find('.remove-tag').click(() => {
                newTag.remove()
                console.log('RemovedCLICKED')
            })
            const tag = aheadData.Tag.map(a => a.name)
            $(tagTypeAhead).typeahead({
                hint: true,
                highlight: true,
                minLength: 1
            }, {
                name: 'Tag',
                limit: 10,
                source: substringMatcher(tag)
            })

            $(tagTypeAhead).bind('typeahead:select', (ev, suggestion) => {
                const select = aheadData.Tag.find(a => a.name === suggestion)
                select.model = 'Tag'
                getTypeAheadSelected(select).then((data) => {
                    console.log('Data from TYpeahead', data)
                    // newTag.find('.tag').attr('value', data.name).prop('disabled', true)
                })
            })
        }
    }
    const organUI = () => {
        const organTemp = $('.hidden-organ')
        const organInitGrp = $('.organ-grp')
        const organWrapper = $('.organ-wrapper')
        const addorgan = $('.add-organ')
        addorgan.click((e) => {
            const organGrp = $('.organ-grp')
            if (organGrp.length) {
                $.each(organGrp, (i, item) => {
                    if (i === organGrp.length - 1) {
                        addNeworgan(i + 1)
                    }
                })
            } else {
                addNeworgan(0)
            }
        })

        $.each(organInitGrp, (i, item) => {
            $(item).find('.remove-organ').click(() => {
                const grp = $(item)
                if (window.location.pathname.indexOf('account/murals/edit/') > -1) {
                    const muralD = {
                        muralId: window._id,
                        modelId: grp.data('mid'),
                        modelType: 'organ'
                    }
                    removeModelApiCall(muralD, () => {
                        grp.remove()
                    })
                } else {
                  grp.remove()
                }
            })
        })

        const addNeworgan = (idx) => {
            const neworgan = organTemp.clone()
            const organTypeAhead = neworgan.find('.organ')
            neworgan.find('.organ').attr('name', `organs[${idx}][organ]`)
            neworgan.find('.remove-organ').data('idx', idx)
            neworgan.find('label').text(`Organization ${idx + 1}`)
            neworgan
                .attr('data-idx', idx)
                .removeClass('hide')
                .removeClass('hidden-organ')
                .addClass('organ-grp')
            organWrapper.prepend(neworgan)
            neworgan.find('.remove-organ').click(() => {
                neworgan.remove()
                console.log('RemovedCLICKED')
            })
            const organ = aheadData.Organ.map(a => a.name)
            $(organTypeAhead).typeahead({
                hint: true,
                highlight: true,
                minLength: 1
            }, {
                name: 'Organ',
                limit: 10,
                source: substringMatcher(organ)
            })

            $(organTypeAhead).bind('typeahead:select', (ev, suggestion) => {
                const select = aheadData.Organ.find(a => a.name === suggestion)
                select.model = 'Organ'
                getTypeAheadSelected(select).then((data) => {
                    console.log('Data from TYpeahead', data)
                    // neworgan.find('.organ').attr('value', data.name).prop('disabled', true)
                })
            })
        }
    }
    const linkUI = () => {
        const linkTemp = $('.hidden-link')
        const linkInitGrp = $('.link-grp')
        const linkWrapper = $('.links-wrapper')
        const addlink = $('.add-link')
        addlink.click((e) => {
            const linkGrp = $('.link-grp')
            if (linkGrp.length) {
                $.each(linkGrp, (i, item) => {
                    if (i === linkGrp.length - 1) {
                        addNewlink(i + 1)
                    }
                })
            } else {
                addNewlink(0)
            }
        })

        $.each(linkInitGrp, (i, item) => {
            $(item).find('.remove-link').click(() => {
                const grp = $(item)
                if (window.location.pathname.indexOf('account/murals/edit/') > -1) {
                    const muralD = {
                        muralId: window._id,
                        modelId: grp.data('mid'),
                        modelType: 'link'
                    }
                    removeModelApiCall(muralD, () => {
                        grp.remove()
                    })
                } else {
                    grp.remove()
                }
            })
        })

        const addNewlink = (idx) => {
            const newlink = linkTemp.clone()
            const linkTypeAhead = newlink.find('.link')
            newlink.find('.link').attr('name', `links[${idx}][link]`)
            newlink.find('.remove-link').data('idx', idx)
            newlink.find('label').text(`link ${idx + 1}`)
            newlink
                .attr('data-idx', idx)
                .removeClass('hide')
                .removeClass('hidden-link')
                .addClass('link-grp')
            linkWrapper.prepend(newlink)
            newlink.find('.remove-link').click(() => {
                newlink.remove()
                console.log('RemovedCLICKED')
            })
            const link = aheadData.Link.map(a => a.name)
            $(linkTypeAhead).typeahead({
                hint: true,
                highlight: true,
                minLength: 1
            }, {
                name: 'Link',
                limit: 10,
                source: substringMatcher(link)
            })

            $(linkTypeAhead).bind('typeahead:select', (ev, suggestion) => {
                const select = aheadData.Link.find(a => a.name === suggestion)
                select.model = 'Link'
                getTypeAheadSelected(select).then((data) => {
                    console.log('Data from TYpeahead', data)
                    // newLink.find('.link').attr('value', data.name).prop('disabled', true)
                })
            })
        }
    }
    const draftCheck = window.location.pathname.indexOf('/account/draft')
    const muralCheck = window.location.pathname.indexOf('/account/murals')
    if (draftCheck > -1 || muralCheck > -1) {
        getTypeAheadData().then(() => {
            artistUI()
            tagUI()
            organUI()
            linkUI()
        })
    }
})
