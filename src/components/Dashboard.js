import React, { Component } from "react";
import axios from "axios";

import classnames from "classnames";

import Loading from "./Loading";
import Panel from "./Panel";

import {
 getTotalInterviews,
 getLeastPopularTimeSlot,
 getMostPopularDay,
 getInterviewsPerDay
} from "helpers/selectors";

import { setInterview } from "helpers/reducers";

const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay
  }
]

class Dashboard extends Component {
  state = { 
    loading: true,
    focused: null,
    days: [],
    interviewers: [],
    appointments: []
  }

  
  selectPanel = id => {
    this.setState(previousState => ({
      // if focused is null set it as id and if focused is id set it back to null
      focused: previousState.focused !== null ? null : id
    }));
  };
  
  componentDidMount() {
    const focused = JSON.parse(localStorage.getItem("focused"));
    
    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);

    this.socket.onmessage = event => {
      const data = JSON.parse(event.data);
    
      if (typeof data === "object" && data.type === "SET_INTERVIEW") {
        this.setState(previousState =>
          setInterview(previousState, data.id, data.interview)
        );
      }
    };

    if (focused) {
      this.setState({ focused });
    }

    Promise.all([
      axios.get("/api/days"),
      axios.get("/api/appointments"),
      axios.get("/api/interviewers")
    ]).then(([days, appointments, interviewers]) => {
      console.log("data imported");
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data
      });
    });
  }

  componentDidUpdate(previousProps, previousState) {
    if (previousState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }

  componentWillUnmount() {
    this.socket.close();
  }

  render() {
    // show all of the panels or just selected panel
    const panelArr = data.filter(panel => this.state.focused === null || this.state.focused === panel.id).map(panel => {
      return(<Panel 
        key={panel.id}
        label={panel.label}
        value={panel.getValue(this.state)}
        onSelect={event => this.selectPanel(panel.id)}
        />)
      })
      
    if (this.state.loading){
      return <Loading />;
    }
    console.log(this.state);
    
    const dashboardClasses = classnames("dashboard", {
      "dashboard--focused": this.state.focused
     });

    return <main className={dashboardClasses}>{panelArr}</main>;
  }
}

export default Dashboard;
