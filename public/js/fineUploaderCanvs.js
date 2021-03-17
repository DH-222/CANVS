$(document).ready(() => {
    let fileArray = []
    let manualUploader
    let autoUpload
    const thumbData = $('#mainThumb')
    const lookUp = {
        'image/jpeg': 'jpeg',
        'image/png': 'png'
    }
    let initialLoad = true
    let editNumber = -1
    const checkAgent = () => !!(navigator.userAgent.indexOf('iPhone') || navigator.userAgent.indexOf('Android'))
    console.log('User agent: -', checkAgent())
    const dropThumbid = ''
    const geocoder = new google.maps.Geocoder()

    function ConvertDMSToDD (degrees, minutes, seconds, direction) {
        let dd = degrees + (minutes / 60) + (seconds / (60*60))

        if (direction === 'S' || direction === 'W') {
            dd *= -1
        }

        return dd
    }

    assembleCoordPoints = (exif, type) => {
        if (type === 'lat') {
            const latDegree = exif.GPSLatitude[0].numerator
            const latMinute = exif.GPSLatitude[1].numerator
            const latSecond = exif.GPSLatitude[2].numerator/1000
            const latDirection = exif.GPSLatitudeRef
            return ConvertDMSToDD(latDegree, latMinute, latSecond, latDirection)
        }
        const lonDegree = exif.GPSLongitude[0].numerator
        const lonMinute = exif.GPSLongitude[1].numerator
        const lonSecond = exif.GPSLongitude[2].numerator/1000
        const lonDirection = exif.GPSLongitudeRef
        return ConvertDMSToDD(lonDegree, lonMinute, lonSecond, lonDirection)
    }

    function getExif (dd) {
        const imgData = `/get/images/view/mural/${dd.uuid}/${dd.name}`
        const x = document.createElement('IMG')
        x.classList.add('img-test')
        document.body.append(x)
        x.src = imgData
        x.onload = () => {
            EXIF.getData(x, () => {
                console.log('make', EXIF.getAllTags(x))
                const allTags = EXIF.getAllTags(x)
                // const latLonDir = (type) => {
                //     if (type === 'lat') {
                //         if (allTags.GPSLatitudeRef === 'N') {
                //             return allTags.GPSLatitude[0].numerator
                //         } else if (allTags.GPSLatitudeRef === 'S') {
                //             return -Math.abs(allTags.GPSLatitude[0].numerator)
                //         }
                //     } else if (allTags.GPSLongitudeRef === 'E') {
                //         return allTags.GPSLongitude[0].numerator
                //     } else if (allTags.GPSLongitudeRef === 'W') {
                //         return -Math.abs(allTags.GPSLongitude[0].numerator)
                //     }
                // }
                if (allTags.GPSLatitude) {
                    const exifData = {
                        lat: assembleCoordPoints(allTags,'lat'),
                        lng: assembleCoordPoints(allTags)
                    }
                    const latlng = { lat: parseFloat(exifData.lat), lng: parseFloat(exifData.lng) }
                    console.log('latLong: -- ', latlng)
                    geocoder.geocode({ location: latlng }, (results, status) => {
                        if (status === 'OK') {
                            console.log(results)
                        } else {
                            console.log('error', status)
                        }
                    })
                    console.log('exifData_-- ', exifData)
                }
            })
        }

        // const img2 = document.getElementById('img2')
        // EXIF.getData(img2, function () {
        //     const allMetaData = EXIF.getAllTags(this)
        //     const allMetaDataSpan = document.getElementById('allMetaDataSpan')
        //     allMetaDataSpan.innerHTML = JSON.stringify(allMetaData, null, '\t')
        // })
    }
    $('.template-fine').load('/js/fine-upload-template.html', () => {
        // const fileWrapper = $('.qq-upload-list-selector')
        manualUploader = new qq.FineUploader({
            element: document.getElementById('uploader-fine-file'),
            camera: {
                ios: checkAgent()
            },
            template: 'qq-template-manual-trigger',
            request: {
                endpoint: '/set/images/mural'
            },
            thumbnails: {
                placeholders: {
                    waitingPath: '/js/lib/fine-uploader/placeholders/waiting-generic.png',
                    notAvailablePath: '/js/lib/fine-uploader/placeholders/not_available-generic.png'
                }
            },
            autoUpload: ((b) => { autoUpload = b; return b })(true),
            debug: false,
            validation: {
                allowedExtensions: ['jpeg', 'jpg', 'png'],
                itemLimit: 7,
                sizeLimit: 200000 * 200000
            },
            callbacks: {
                onAllComplete: (e) => {
                    console.log('Completed', e)
                    if ((e.length > 0) && window.imgData) {
                        fileArray = []
                        setTimeout(() => {
                            createCustomElements()
                            storeInputMeta()
                            fileArray.forEach((item) => {
                                $(item.ele).find('.custom-delete').removeClass('hide')
                            })
                            if (initialLoad === false) {
                                updateServerData()
                            }
                            initialLoad = false
                        }, 200)
                    }
                },
                onValidateBatch: (im) => {
                    if (!window.imgData) {
                        fileArray = []
                        console.log('valicalled')
                        setTimeout(() => {
                            createCustomElements(false)
                            storeInputMeta()
                        }, 200)
                    }
                },
                onSubmit: (id) => {
                    console.log('Submit started')
                    const file = manualUploader.getFile(id)
                    manualUploader.setName(id, `image-id${id}.${lookUp[file.type]}`)
                    if (window.imgData) {
                        editNumber = id
                    }
                },
                onCancel: (id) => {
                    filesArrSplice(id)
                    storeInputMeta()
                    deleteServerData()
                }
            }
        })
        if (window.imgData) {
            console.log(_id, imgData)
            manualUploader.addInitialFiles(imgData)
        }

        qq(document.getElementById('trigger-upload')).attach('click', () => {
            manualUploader.uploadStoredFiles()
        })
    })

    const createCustomElements = () => {
        $('.qq-upload-list-selector li').each((item, el) => {
            const ele = $(el)
            const { button, dId, uuid, size, name } = getFileData(ele)
            const thumbnailUrl = thumbnailData(dId, uuid, name)
            const findEle = ele.find('.custom-delete').length
            let thumbIcon = ele.find('.fa.fa-thumbs-up')
            if (!thumbIcon) {
                thumbIcon = $('<i class="fa fa-thumbs-up hide"></i>')
                ele.append(thumbIcon)
            }
            if (uuid === window.mainThumb) {
                console.log('Main Thumb is', mainThumb)
                thumbIcon.removeClass('hide')
            }
            fileArray.push({ id: dId, uuid, ele, name, size, thumbnailUrl })
            if (findEle === 0) {
                ((u, i, e, b) => {
                    b.click(() => {
                        deleteFile(u, i)
                    })
                    if (autoUpload) b.removeClass('hide')
                    e.append(b)
                })(uuid, dId, ele, button)
            }
            const imageClicker = ele.find('.qq-thumbnail-selector')
            imageClicker.data('uuid', uuid)
            imageClicker.on('click', (e) => {
                $('.fa-thumbs-up').addClass('hide')
                const self = $(e.target)
                self.parent().find('.fa-thumbs-up').removeClass('hide')
                thumbData.attr('value', self.data('uuid'))
                // console.log(self.data('uuid'))
            })
        })
    }

    const storeInputMeta = () => {
        const form = $('#add-mural-form')
        form.find('.images-inputs').remove()
        const uuids = filesArrPayload()
        console.log('Whatt ', uuids)
        const ele = $(`<input type="text" class="images-inputs hide" name="imageInputs" value=${JSON.stringify(uuids)}>`)
        getExif(uuids[0])
        form.prepend(ele)
    }

    const thumbnailData = (dId, uuid, name) => {
        const hit = (window.imgData) ? window.imgData.find(o => o.uuid === uuid) : null
        if (hit) {
            return hit.thumbnailUrl
        }
        const file = manualUploader.getFile(dId)
        return `/get/images/view/mural/${uuid}/thumb-${name}`
    }

    const getFileData = (ele) => {
        const dId = Number(ele[0].attributes[1].nodeValue)
        return {
            button: $('<div class="custom-delete hide">REMOVE</div>'),
            uuid: manualUploader.getUuid(dId),
            size: manualUploader.getSize(dId),
            name: manualUploader.getName(dId),
            dId
        }
    }

    const deleteFile = (uuid, dId) => {
        $.get(`/set/images/mural/${uuid}`, (result) => {
            if (!result.error) {
                manualUploader.cancel(dId)
            }
        })
    }

    const deleteServerData = () => {
        if (window.imgData) {
            const payload = {
                id: _id,
                imageInputs: (fileArray.length) ? filesArrPayload() : []
            }
            $.post('/account/draft/image/edit', payload, (result) => {
                console.log('SuccessMessage', result)
            })
        }
    }

    const updateServerData = () => {
        if (window.imgData) {
            const payload = {
                id: _id,
                imageInputs: filesArrPayload()
            }
            $.post('/account/draft/image/edit', payload, (result) => {
                console.log('SuccessMessage', result)
            })
        }
    }
    const filesArrPayload = () => fileArray.map(item => (
        { uuid: item.uuid, name: item.name, size: item.size, thumbnailUrl: item.thumbnailUrl }))

    const filesArrSplice = (id) => {
        const dObj = fileArray.findIndex(o => o.id === id)
        fileArray.splice(dObj, 1)
    }
    // $('.select-thumb').ddslick(
    //     {
    //         onSelected: (d) => {
    //             console.log('selectedData', d.selectedData.value)
    //             dropThumbid = d.selectedData.value
    //             $('.main-thumbinput').val(d.selectedData.value)
    //         }
    //     })

    const muralImagePreview = $('.set-images')
    console.log('muralImagePreview: -- ', muralImagePreview.children().length)
    if (muralImagePreview.children().length > 0) {
        const pThumb = muralImagePreview.find('.image-preview')
        pThumb.each((idx, item) => {
            const image = $(item)
            if (image.data('id') === thumbData.value) {
                image.find('.fa-thumbs-up').removeClass('hide')
            }
            image.click(() => {
                $('.fa-thumbs-up').addClass('hide')
                image.find('.fa-thumbs-up').removeClass('hide')
                thumbData.attr('value', image.data('id'))
            })
        })
    }
})
