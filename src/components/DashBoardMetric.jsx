import React from 'react';
import { Panel, Glyphicon } from 'react-bootstrap';

class DashBoardMetric extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    if (this.props.bean) {
      fetch(`${this.props.serverUrl}/metrics/v1/mbeans/${this.props.bean}`)
      .then(response => response.json())
      .then(data => this.setState({ value: data[this.props.beanValue] }));
    }
  }

  render() {
    let children;
    if ('value' in this.state) {
      children = `${this.state.value} ${this.props.unit}`;
    } else {
      children = <Glyphicon glyph="refresh" className="spin" />;
    }
    return (
      <Panel
        header={this.props.title}
        bsStyle={this.props.style}
      >{children}</Panel>
    );
  }
}

DashBoardMetric.propTypes = {
  title: React.PropTypes.string.isRequired,
  style: React.PropTypes.oneOf([
    'default',
    'primary',
    'success',
    'info',
    'warning',
    'danger',
  ]).isRequired,
  query: React.PropTypes.string,
  bean: React.PropTypes.string,
  beanValue: React.PropTypes.string,
  multiply: React.PropTypes.number,
  unit: React.PropTypes.string,
  serverUrl: React.PropTypes.string.isRequired,
};

DashBoardMetric.defaultProps = {
  multiply: 1,
  unit: '',
  beanValue: 'Value',
};

export default DashBoardMetric;
