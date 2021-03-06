import PropTypes from 'prop-types'
import React from 'react'
import ReactTable from './../lib/react-table'

export class Query extends React.Component {
  constructor(props) {
    super(props)
    this.state = { open: false }
  }

  toggle() {
    this.setState((prev) => ({
      open: !prev.open
    }));
  }

  render () {
    return (
      <div className={'collapse ' + (this.state.open ? 'open' : '')}>
        <div className='collapse-toggle' onClick={this.toggle.bind(this)}>View Query <i className='icon'></i></div>
        <div className='collapsible'>
          <pre>
            {this.props.value}
          </pre>
        </div>
      </div>
    )
  }
}
Query.propTypes = {
  value: PropTypes.string.isRequired
}

export class Messages extends React.Component {
  constructor(props) {
    super(props)
    this.state = { open: props.value.length > 0 }
    this.size = props.value.length
    this.messages = props.value
    if (this.messages.length === 0) {
      this.messages.push('No messages to show.')
    }
  }

  toggle() {
    this.setState((prev) => ({
      open: !prev.open
    }));
  }
  render () {
    return (
      <div className={'collapse ' + (this.state.open ? 'open' : '')}>
        <div className='collapse-toggle' onClick={this.toggle.bind(this)}>Query Messages <small>({this.size} messages)</small><i className='icon'></i></div>
        <div className='collapsible'>
          <div className='messages'>
            {this.messages.map((m, i) => {
              return (<div key={i} className={'message ' + (this.props.error ? 'error' : '')}>{m}</div>)
            })}
          </div>
        </div>
      </div>
    )
  }
}
Messages.propTypes = {
  value: PropTypes.any.isRequired,
  error: PropTypes.any
}

export class ResultsTable extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      filtered: {}
    }
    this.filters = {}
  }
  render() {
    const cols = this.props.value.cols.map((c) => {
      return {
        Header: c,
        accessor: c,
        Cell: (r) => {
          let v = r.original[r.column.id]
          if (v === null) return <small>(NULL)</small>
          if (v === true) return <span>TRUE</span>
          if (v === false) return <span>FALSE</span>
          if (typeof v === 'object' || Array.isArray(v)) {
            return (<div className='syntax json'><pre>{JSON.stringify(v)}</pre></div>)
          }
          v = String(v)
          if (!this.state.filtered[r.column.id]) return v
          return (
            v.replace(this.state.filtered[r.column.id], '<###>$1<###>').split('<###>')
              .map((str, i) => {
                if (i % 2 === 1) return <mark key={i} className='filter-highlight'>{str}</mark>
                if (str.trim().length === 0) return null
                return <span key={i}>{str}</span>
              })
          )
        }
      };
    })
    return (
      <div className='results-table'>
        <ReactTable
          noDataText="Query didn't return any results."
          data={this.props.value.data}
          columns={cols}
          filterable
          FilterComponent={({ filter, column, onChange }) => {
            return (
            <input
              type="text"
              placeholder={`Filter by ${column.id}`}
              style={{ width: '100%' }}
              value={filter ? filter.value : ''}
              onChange={event => onChange(event.target.value)}
            />
          )}}
          getTdProps={(state, rowInfo, column) => {
            try {
              const v = rowInfo.original[column.id]
              const props = {}
              if (v === true) props.className = 'td-icon green'
              if (v === false) props.className = 'td-icon red'
              return props;
            } catch (e) { /**/ }
            return {}
          }}
          onFilteredChange={(filtered) => {
            this.setState({ filtered: filtered.reduce((p, c) => {
              let exp = String(c.value)
              try {
                exp = new RegExp(`(${exp})`, 'gi');
              } catch (e) { /***/
              }
              p[c.id] = exp
              return p
            }, {}) })
          }}
          defaultFilterMethod={(filter, row) => {
            let exp = String(filter.value)
            try {
              exp = new RegExp(`(${exp})`, 'gi');
              return exp.test(String(row[filter.id]))
            } catch (e) {
              return String(row[filter.id]) === exp
            }
          }}
          className='-striped'
          style={{
            height: '98%'
          }}
        />
      </div>
    )
  }
}
ResultsTable.propTypes = {
  value: PropTypes.any.isRequired
}

export class QueryResult extends React.Component {
  render () {
    let table = 'Query with errors. Please, check the error below.'
    if (this.props.value.error !== true) {
      table = <ResultsTable value={{ cols: this.props.value.cols, data: this.props.value.results}} />
    }
    return (
      <div className={'result fix-height ' + this.props.className}>
        {table}
        <div className='query-extras'>
          <Query value={this.props.value.query} />
          <Messages value={this.props.value.messages} error={this.props.value.error || false} />
        </div>
      </div>
    )
  }
}
QueryResult.propTypes = {
  value: PropTypes.any.isRequired,
  className: PropTypes.string,
}

export default class QueryResults extends React.Component {
  constructor(props) {
    super(props)
    this.state = { isLoaded: false, active: 0, data: [], messages: [], waiting: true, success: true }
  }

  toggle(i) {
    this.setState(() => ({
      active: i
    }));
  }

  componentDidMount() {
    let interval = setInterval(() => {
      fetch(`${window.location.origin}/api/query-results`)
        .then((res) => res.json())
        .then((res) => {
          if (res.waiting === false && res.success === true) {
            clearInterval(interval);
            interval = null;
          }
          this.setState({ isLoaded: true, data: res.results, waiting: res.waiting, messages: res.messages || [], success: res.success })
        }, (e) => console.error(e))
    }, 500);
  }

  render () {
    if (!this.state.isLoaded && this.state.waiting) {
      return (<h2>loading...</h2>)
    } else if (this.state.isLoaded && this.state.waiting) {
      return (<h2>Waiting query results...</h2>)
    } else if (this.state.isLoaded && !this.state.waiting && !this.state.success) {
      return (<div>
        <h2>Query errored. Check the logs.</h2>
        (
          {this.state.messages.map((m, i) => {
            return (<h4 key={i}>{m}</h4>)
          })}
        )
      </div>)
    }

    const tabs = []
    const results = this.state.data.map((res, i) => {
      tabs.push(
        <li
          title={res.query}
          key={i}
          onClick={this.toggle.bind(this, i)}
          className={'truncate ' + (this.state.active === i ? 'active' : '')}
        >
          {res.query}
        </li>
      )
      return <QueryResult
        value={res}
        key={i}
        error={res.error}
        className={this.state.active === i ? 'active' : ''}
      />
    })

    return (
      <div className='fix-height'>
        <ul className='tabs'>{tabs}</ul>
        <div className='results'>{results}</div>
      </div>
    )
  }
}
