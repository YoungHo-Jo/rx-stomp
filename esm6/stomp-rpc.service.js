import { UUID } from 'angular2-uuid';
import { Observable } from "rxjs";
import { filter, first } from "rxjs/operators";
/**
 * An implementation of RPC service using messaging.
 *
 * Please see the [guide](../additional-documentation/rpc---remote-procedure-call.html) for details.
 */
var StompRPCService = /** @class */ (function () {
    /**
     * Create an instance, see the [guide](../additional-documentation/rpc---remote-procedure-call.html) for details.
     */
    function StompRPCService(stompService, stompRPCConfig) {
        var _this = this;
        this.stompService = stompService;
        this.stompRPCConfig = stompRPCConfig;
        this._replyQueueName = '/temp-queue/rpc-replies';
        this._setupReplyQueue = function () {
            return _this.stompService.defaultMessagesObservable;
        };
        if (stompRPCConfig) {
            if (stompRPCConfig.replyQueueName) {
                this._replyQueueName = stompRPCConfig.replyQueueName;
            }
            if (stompRPCConfig.setupReplyQueue) {
                this._setupReplyQueue = stompRPCConfig.setupReplyQueue;
            }
        }
    }
    /**
     * Make an RPC request. See the [guide](../additional-documentation/rpc---remote-procedure-call.html) for example.
     */
    StompRPCService.prototype.rpc = function (serviceEndPoint, payload, headers) {
        // We know there will be only one message in reply
        return this.stream(serviceEndPoint, payload, headers).pipe(first());
    };
    /**
     * Make an RPC stream request. See the [guide](../additional-documentation/rpc---remote-procedure-call.html).
     */
    StompRPCService.prototype.stream = function (serviceEndPoint, payload, headers) {
        var _this = this;
        if (headers === void 0) { headers = {}; }
        if (!this._repliesObservable) {
            this._repliesObservable = this._setupReplyQueue(this._replyQueueName, this.stompService);
        }
        return Observable.create(function (rpcObserver) {
            var defaultMessagesSubscription;
            var correlationId = UUID.UUID();
            defaultMessagesSubscription = _this._repliesObservable.pipe(filter(function (message) {
                return message.headers['correlation-id'] === correlationId;
            })).subscribe(function (message) {
                rpcObserver.next(message);
            });
            // send an RPC request
            headers['reply-to'] = _this._replyQueueName;
            headers['correlation-id'] = correlationId;
            _this.stompService.publish(serviceEndPoint, payload, headers);
            return function () {
                defaultMessagesSubscription.unsubscribe();
            };
        });
    };
    return StompRPCService;
}());
export { StompRPCService };
//# sourceMappingURL=stomp-rpc.service.js.map