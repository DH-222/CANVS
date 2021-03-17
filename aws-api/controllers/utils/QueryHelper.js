const ObjectId = require('mongoose').Types.ObjectId

// TODO sanitize and clean up user inputs
module.exports = class QueryHelper {
    constructor () {
        this.defaultParams = {
            sort: 'name-asc',
            page: 1,
            size: 20,
            render: 'normal'
        }
        this.paramLookUp = ['sort', 'page', 'size', 'render', 'search']
    }
    // query assembly
    queryType (req) {
        let query = {}
        if (req.params.key) {
            query = { [req.params.key]: req.params.val }
        } else if (req.params.searchType) {
            query = this.artistMuralSearchQuery(req)
        } else if (req.body.batchId) {
            query = { _id: { $in: req.body.batchId } }
        } else if (req.params.id) {
            query = { _id: req.params.id }
        } else if (req.params.dataId) {
            query = {
                _id: req.params.dataId,
                dataQuery: ids =>
                    ({ _id: { $in: ids }, active: true})
            }
        } else if (req.params.modelMID) {
            query = {
                _id: req.params.modelMID,
                dataQuery: ids =>
                    ({ _id: { $in: ids }, active: true })
            }
        }
        query.active = true
        return query
    }

    artistMuralSearchQuery (req) {
        if (req.params.searchType === 'artist' || req.params.searchType === 'mural') {
            return {
                $and: [
                    {
                        $or: [
                            { name: { $regex: req.query.search, $options: '$i$m' } },
                            { about: { $regex: req.query.search, $options: '$i$m' } }
                        ]
                    }] }
        } else if (req.params.searchType === 'tag' || req.params.searchType === 'link' || req.params.searchType === 'organ') {
            const arrayName = (req.params.searchType === 'organ') ? `${req.params.searchType}izations.name` : `${req.params.searchType}s.name`
            return {
                $and: [
                    {
                        $or: [
                            { name: { $regex: req.query.search, $options: '$i$m' } },
                            { [arrayName]: { $regex: req.query.search, $options: '$i$m' } }
                        ]
                    }] }
        }
    }

    // single doc request
    paramsIdName (req, res) {
        const { params: p } = req
        if (p.id) {
            return { _id: new ObjectId(p.id) }
        } else if (p.name) {
            return { name: String(p.name) }
        }
        res.send({ error: true, message: 'Need to supply a query parameter /' })
    }

    // spilt sort date param
    breakParamSort (param) {
        const p = param.split('-')
        const key = (p[0] === 'date') ? 'creationDate' : p[0]
        const value = (p[1] === 'asc') ? 1 : -1
        return { [key]: value }
    }

    // options for mongo query pager
    optionsPager (req, res, sorter) {
        const page = parseInt(req.query.page) || this.defaultParams.page
        const size = parseInt(req.query.size) || this.defaultParams.size
        const sort = req.query.sort ? this.breakParamSort(req.query.sort) : this.defaultParams.sort
        if (page < 0 || page === 0) {
            res.send({ error: true, message: 'No results for page 0' })
        }
        return {
            skip: size * (page - 1),
            limit: size,
            sort
        }
    }

    // check params and determine if default or user provided
    paramAssembly (req, pageVal) {
        let assemblyString = ''
        let value
        let url
        this.paramLookUp.forEach((item, i) => {
            if (req.query[item]) {
                value = (item === 'page') ? pageVal : req.query[item]
                url = (i === 0) ? `?${item}=${value}` : `&${item}=${value}`
            } else {
                value = (item === 'page') ? pageVal : this.defaultParams[item]
                url = (i === 0) ? `?${item}=${value}` : `&${item}=${value}`
            }
            assemblyString += url
        })
        return assemblyString
    }

    // create next prev in payload delivery
    nextPagePopulate (req, result) {
        const url = req._parsedUrl.pathname
        const page = this.checkPageCountcb(req, result)
        return {
            // nextPage: (page < result.totalPages) ? `${url}${this.paramAssembly(req, page + 1)}` : null,
            // prevPage: (page >= 2 && (page <= result.totalPages)) ? `${url}${this.paramAssembly(req, page - 1)}` : null
            nextPage: (page < result.totalPages) ? page + 1 : 0,
            prevPage: (page >= 2 && (page <= result.totalPages)) ? page - 1 : 0
        }
    }

    // should page be reset based on user params errors -- graceful fail
    checkPageCountcb (req, result) {
        if (result.pageReset) {
            return 1
        }
        return parseInt(req.query.page) || this.defaultParams.page
    }

    // graceful error handling for bad page numbers
    assemblePager (req, result) {
        const { nextPage, prevPage } = this.nextPagePopulate(req, result)
        const { totalPages, totalCount, data } = result
        if (result.pageReset) {
            return { warning: 'Page was reset to 0 for data provided out of index page number', totalPages, totalCount, nextPage, prevPage, data }
        }
        return { totalPages, totalCount, nextPage, prevPage, data }
    }
}
